using System.Diagnostics;
using System.IO.Compression;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace RaqeebProtector;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        using var application = new ProtectorApplication();
        Application.Run(application);
    }
}

internal sealed class ProtectorApplication : ApplicationContext
{
    private const string Marker = "# Raqeeb managed blocklist";
    private static readonly HashSet<string> BrowserExecutables = new(StringComparer.OrdinalIgnoreCase)
    {
        "brave",
        "chrome",
        "firefox",
        "iexplore",
        "msedge",
        "opera",
        "vivaldi"
    };
    private readonly Icon applicationIcon;
    private readonly NotifyIcon tray;
    private readonly MainWindow window;
    private readonly System.Windows.Forms.Timer monitorTimer;
    private readonly string hostsPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.System),
        @"drivers\etc\hosts");
    private bool focusEnabled;
    private bool shuttingDown;

    public ProtectorApplication()
    {
        applicationIcon = Icon.ExtractAssociatedIcon(Application.ExecutablePath)
            ?? throw new InvalidOperationException("The Raqeeb application icon is missing from this executable.");
        tray = new NotifyIcon
        {
            Icon = applicationIcon,
            Visible = true,
            Text = "Raqeeb Protector"
        };

        var menu = new ContextMenuStrip();
        menu.Items.Add("Open Raqeeb", null, (_, _) => ShowMainWindow());
        menu.Items.Add("Enable blocked domains", null, (_, _) => ApplyBlocklist());
        menu.Items.Add("Disable blocked domains", null, (_, _) => RemoveBlocklist());
        var focusItem = new ToolStripMenuItem("Focus shield") { CheckOnClick = true };
        focusItem.CheckedChanged += (_, _) => focusEnabled = focusItem.Checked;
        menu.Items.Add(focusItem);
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Exit", null, (_, _) => ExitApplication());
        tray.ContextMenuStrip = menu;
        tray.DoubleClick += (_, _) => ShowMainWindow();

        monitorTimer = new System.Windows.Forms.Timer { Interval = 1000 };
        monitorTimer.Tick += (_, _) => EnforceFocus();

        window = new MainWindow();
        MainForm = window;
        window.FormClosing += HandleWindowClosing;
        window.Resize += HandleWindowResize;

        monitorTimer.Start();
        ApplyBlocklist();
        ShowMainWindow();
    }

    private void ShowMainWindow()
    {
        if (window.WindowState == FormWindowState.Minimized)
            window.WindowState = FormWindowState.Normal;
        window.Show();
        window.Activate();
    }

    private void HandleWindowClosing(object? sender, FormClosingEventArgs args)
    {
        if (shuttingDown) return;
        args.Cancel = true;
        window.Hide();
    }

    private void HandleWindowResize(object? sender, EventArgs args)
    {
        if (window.WindowState != FormWindowState.Minimized) return;
        window.Hide();
        window.WindowState = FormWindowState.Normal;
    }

    private void ApplyBlocklist()
    {
        var hostsWritten = false;
        try
        {
            var domains = ReadEmbeddedDomains();
            var original = File.Exists(hostsPath) ? File.ReadAllText(hostsPath) : string.Empty;
            var withoutManaged = RemoveManagedBlock(original);
            var managed = new StringBuilder(withoutManaged);
            if (managed.Length > 0 && managed[^1] != '\n')
                managed.AppendLine();
            managed.AppendLine(Marker);
            foreach (var domain in domains)
            {
                managed.Append("127.0.0.1 ").AppendLine(domain);
                managed.Append("127.0.0.1 www.").AppendLine(domain);
            }
            managed.AppendLine(Marker + " end");

            if (File.Exists(hostsPath) && !File.Exists(hostsPath + ".raqeeb.bak"))
                File.Copy(hostsPath, hostsPath + ".raqeeb.bak");
            File.WriteAllText(hostsPath, managed.ToString(), new UTF8Encoding(false));
            hostsWritten = true;
            FlushDns();
            tray.ShowBalloonTip(2500, "Raqeeb", $"Applied {domains.Length} blocked domains.", ToolTipIcon.Info);
        }
        catch (Exception exception)
        {
            ShowTrayError(
                hostsWritten ? "Hosts entries were written, but DNS could not be flushed" : "Could not apply the hosts blocklist",
                exception);
        }
    }

    private bool RemoveBlocklist()
    {
        try
        {
            if (!File.Exists(hostsPath)) return true;
            var original = File.ReadAllText(hostsPath);
            var cleaned = RemoveManagedBlock(original);
            if (cleaned == original) return true;

            File.WriteAllText(hostsPath, cleaned, new UTF8Encoding(false));
            try
            {
                FlushDns();
            }
            catch (Exception exception)
            {
                ShowTrayError("Raqeeb's entries were removed, but DNS could not be flushed", exception);
            }
            return true;
        }
        catch (Exception exception)
        {
            ShowTrayError("Could not remove Raqeeb's hosts entries", exception);
            return false;
        }
    }

    private static string[] ReadEmbeddedDomains()
    {
        using var stream = Assembly.GetExecutingAssembly()
            .GetManifestResourceStream("RaqeebProtector.BlockedDomains.txt")
            ?? throw new InvalidOperationException("The embedded default blocklist is missing.");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd()
            .Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries)
            .Select(domain => domain.Trim())
            .Where(domain => domain.Length > 0 && !domain.StartsWith('#'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static string RemoveManagedBlock(string content)
    {
        var start = content.IndexOf(Marker, StringComparison.Ordinal);
        while (start >= 0)
        {
            var endMarker = Marker + " end";
            var end = content.IndexOf(endMarker, start, StringComparison.Ordinal);
            if (end < 0)
                throw new InvalidDataException("The Raqeeb hosts section is incomplete; the hosts file was left unchanged.");
            content = content[..start] + content[(end + endMarker.Length)..];
            start = content.IndexOf(Marker, StringComparison.Ordinal);
        }
        return content;
    }

    private static void FlushDns()
    {
        using var process = Process.Start(new ProcessStartInfo
        {
            FileName = "ipconfig.exe",
            Arguments = "/flushdns",
            UseShellExecute = false,
            CreateNoWindow = true
        }) ?? throw new InvalidOperationException("Could not start ipconfig.exe to flush DNS.");

        if (!process.WaitForExit(10_000))
        {
            process.Kill();
            throw new TimeoutException("Timed out while flushing the Windows DNS cache.");
        }
        if (process.ExitCode != 0)
            throw new InvalidOperationException($"ipconfig.exe exited with code {process.ExitCode}.");
    }

    private void ShowTrayError(string message, Exception exception)
    {
        tray.ShowBalloonTip(5000, "Raqeeb - protection error", $"{message}: {exception.Message}", ToolTipIcon.Error);
    }

    private void ExitApplication()
    {
        if (!RemoveBlocklist()) return;
        shuttingDown = true;
        window.Close();
        ExitThread();
    }

    private void EnforceFocus()
    {
        if (!focusEnabled) return;
        var hwnd = NativeMethods.GetForegroundWindow();
        if (hwnd == IntPtr.Zero || !IsBrowserWindow(hwnd)) return;
        var title = new StringBuilder(512);
        NativeMethods.GetWindowText(hwnd, title, title.Capacity);
        var text = title.ToString();
        if (text.Contains("porn", StringComparison.OrdinalIgnoreCase) ||
            text.Contains("xxx", StringComparison.OrdinalIgnoreCase))
        {
            NativeMethods.ShowWindow(hwnd, NativeMethods.SW_MINIMIZE);
        }
    }

    private static bool IsBrowserWindow(IntPtr hwnd)
    {
        NativeMethods.GetWindowThreadProcessId(hwnd, out var processId);
        if (processId == 0) return false;

        try
        {
            using var process = Process.GetProcessById((int)processId);
            var executablePath = process.MainModule?.FileName;
            return executablePath is not null &&
                BrowserExecutables.Contains(Path.GetFileNameWithoutExtension(executablePath));
        }
        catch (Exception exception) when (
            exception is ArgumentException or InvalidOperationException or System.ComponentModel.Win32Exception)
        {
            Trace.TraceWarning($"Could not inspect foreground process {processId}: {exception.Message}");
            return false;
        }
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            monitorTimer.Dispose();
            tray.Visible = false;
            applicationIcon.Dispose();
            tray.Dispose();
            window.Dispose();
        }
        base.Dispose(disposing);
    }

    private static class NativeMethods
    {
        internal const int SW_MINIMIZE = 6;
        [DllImport("user32.dll")] internal static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")] internal static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
        [DllImport("user32.dll", CharSet = CharSet.Unicode)] internal static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
        [DllImport("user32.dll")] internal static extern bool ShowWindow(IntPtr hWnd, int command);
    }
}

internal sealed class MainWindow : Form
{
    private const string VirtualHost = "raqeeb.local";
    private const string WebAssetsResource = "RaqeebProtector.WebAssets.zip";
    private const string RuntimeDownloadUrl = "https://developer.microsoft.com/microsoft-edge/webview2/";
    private readonly WebView2 webView;

    public MainWindow()
    {
        Text = "رَقِيب - الرفيق الرقمي الواعي";
        Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath)
            ?? throw new InvalidOperationException("The Raqeeb application icon is missing from this executable.");
        BackColor = Color.FromArgb(15, 23, 42);
        StartPosition = FormStartPosition.CenterScreen;
        MinimumSize = new Size(1024, 700);
        Size = new Size(1280, 820);

        webView = new WebView2 { Dock = DockStyle.Fill };
        Controls.Add(webView);
        Shown += async (_, _) => await InitializeWebViewAsync();
    }

    private async Task InitializeWebViewAsync()
    {
        try
        {
            var assetsDirectory = ExtractWebAssets();
            var dataDirectory = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "RaqeebProtector",
                "WebView2");
            Directory.CreateDirectory(dataDirectory);

            var environment = await CoreWebView2Environment.CreateAsync(
                browserExecutableFolder: null,
                userDataFolder: dataDirectory);
            await webView.EnsureCoreWebView2Async(environment);
            webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                VirtualHost,
                assetsDirectory,
                CoreWebView2HostResourceAccessKind.DenyCors);
            webView.Source = new Uri($"https://{VirtualHost}/index.html");
        }
        catch (Exception exception)
        {
            ShowWebViewError(exception);
        }
    }

    private static string ExtractWebAssets()
    {
        using var resource = Assembly.GetExecutingAssembly()
            .GetManifestResourceStream(WebAssetsResource)
            ?? throw new InvalidOperationException("The compiled web dashboard is missing from this build.");
        var hash = Convert.ToHexString(SHA256.HashData(resource));
        var appData = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "RaqeebProtector",
            "WebAssets");
        var destination = Path.Combine(appData, hash);
        var indexPath = Path.Combine(destination, "index.html");
        if (File.Exists(indexPath)) return destination;

        Directory.CreateDirectory(appData);
        if (Directory.Exists(destination))
            Directory.Delete(destination, recursive: true);
        var temporary = Path.Combine(appData, $"{hash}.{Guid.NewGuid():N}.tmp");
        Directory.CreateDirectory(temporary);
        try
        {
            resource.Position = 0;
            using (var archive = new ZipArchive(resource, ZipArchiveMode.Read))
            {
                var root = Path.GetFullPath(temporary) + Path.DirectorySeparatorChar;
                foreach (var entry in archive.Entries)
                {
                    if (string.IsNullOrEmpty(entry.Name)) continue;
                    var path = Path.GetFullPath(Path.Combine(temporary, entry.FullName));
                    if (!path.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                        throw new InvalidDataException("The embedded dashboard archive contains an invalid path.");
                    Directory.CreateDirectory(Path.GetDirectoryName(path)!);
                    entry.ExtractToFile(path, overwrite: true);
                }
            }

            if (!File.Exists(Path.Combine(temporary, "index.html")))
                throw new InvalidDataException("The embedded dashboard archive does not contain index.html.");
            try
            {
                Directory.Move(temporary, destination);
            }
            catch (IOException) when (Directory.Exists(destination) && File.Exists(indexPath))
            {
                Directory.Delete(temporary, recursive: true);
            }
        }
        finally
        {
            if (Directory.Exists(temporary))
                Directory.Delete(temporary, recursive: true);
        }

        return destination;
    }

    private void ShowWebViewError(Exception exception)
    {
        webView.Visible = false;
        var panel = new Panel { Dock = DockStyle.Fill, BackColor = BackColor, Padding = new Padding(32) };
        var message = new Label
        {
            Dock = DockStyle.Top,
            Height = 110,
            ForeColor = Color.White,
            TextAlign = ContentAlignment.MiddleCenter,
            Text = $"The Raqeeb dashboard could not start.\r\n{exception.Message}"
        };
        var link = new LinkLabel
        {
            Dock = DockStyle.Top,
            Height = 36,
            TextAlign = ContentAlignment.MiddleCenter,
            Text = "Install the Microsoft Edge WebView2 Evergreen Runtime"
        };
        link.LinkClicked += (_, _) =>
        {
            try
            {
                Process.Start(new ProcessStartInfo(RuntimeDownloadUrl) { UseShellExecute = true });
            }
            catch (Exception exception)
            {
                MessageBox.Show(this, exception.Message, Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        };
        panel.Controls.Add(link);
        panel.Controls.Add(message);
        Controls.Add(panel);
        panel.BringToFront();
    }
}
