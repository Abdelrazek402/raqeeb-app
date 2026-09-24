using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

namespace RaqeebProtector;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        if (!OperatingSystem.IsWindows())
        {
            Console.Error.WriteLine("Raqeeb Protector requires Windows.");
            return;
        }

        ApplicationConfiguration.Initialize();
        using var protector = new ProtectorApplication();
        Application.Run();
    }
}

internal sealed class ProtectorApplication : IDisposable
{
    private const string Marker = "# Raqeeb managed blocklist";
    private readonly NotifyIcon tray;
    private readonly System.Windows.Forms.Timer monitorTimer;
    private readonly string hostsPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.System),
        @"drivers\etc\hosts");
    private readonly string domainsPath = Path.Combine(AppContext.BaseDirectory, "blocked-domains.txt");
    private bool focusEnabled;

    public ProtectorApplication()
    {
        if (!OperatingSystem.IsWindows()) throw new PlatformNotSupportedException();
        tray = new NotifyIcon
        {
            Icon = SystemIcons.Shield,
            Visible = true,
            Text = "Raqeeb Protector"
        };
        var menu = new ContextMenuStrip();
        menu.Items.Add("Enable blocked domains", null, (_, _) => ApplyBlocklist());
        menu.Items.Add("Disable blocked domains", null, (_, _) => RemoveBlocklist());
        menu.Items.Add("Focus shield", null, (_, _) => focusEnabled = !focusEnabled);
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Exit", null, (_, _) => Application.Exit());
        tray.ContextMenuStrip = menu;

        monitorTimer = new System.Windows.Forms.Timer { Interval = 1000 };
        monitorTimer.Tick += (_, _) => EnforceFocus();
        monitorTimer.Start();
        ApplyBlocklist();
    }

    private void ApplyBlocklist()
    {
        if (!File.Exists(domainsPath))
        {
            tray.ShowBalloonTip(3000, "Raqeeb", "blocked-domains.txt was not found.", ToolTipIcon.Warning);
            return;
        }

        var domains = File.ReadLines(domainsPath)
            .Select(line => line.Trim())
            .Where(line => line.Length > 0 && !line.StartsWith('#'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        var original = File.Exists(hostsPath) ? File.ReadAllText(hostsPath) : string.Empty;
        var withoutManaged = RemoveManagedBlock(original);
        var managed = new StringBuilder(withoutManaged.TrimEnd());
        managed.AppendLine();
        managed.AppendLine(Marker);
        foreach (var domain in domains)
        {
            managed.Append("127.0.0.1 ").AppendLine(domain);
            managed.Append("127.0.0.1 www.").AppendLine(domain);
        }
        managed.AppendLine(Marker + " end");
        File.Copy(hostsPath, hostsPath + ".raqeeb.bak", true);
        File.WriteAllText(hostsPath, managed.ToString() + Environment.NewLine, Encoding.UTF8);
        FlushDns();
        tray.ShowBalloonTip(2500, "Raqeeb", $"Applied {domains.Length} blocked domains.", ToolTipIcon.Info);
    }

    private void RemoveBlocklist()
    {
        if (!File.Exists(hostsPath)) return;
        File.WriteAllText(hostsPath, RemoveManagedBlock(File.ReadAllText(hostsPath)), Encoding.UTF8);
        FlushDns();
    }

    private static string RemoveManagedBlock(string content)
    {
        var start = content.IndexOf(Marker, StringComparison.Ordinal);
        if (start < 0) return content;
        var endMarker = Marker + " end";
        var end = content.IndexOf(endMarker, start, StringComparison.Ordinal);
        if (end < 0) return content[..start].TrimEnd();
        return (content[..start] + content[(end + endMarker.Length)..]).TrimEnd();
    }

    private static void FlushDns()
    {
        using var process = Process.Start(new ProcessStartInfo
        {
            FileName = "ipconfig.exe",
            Arguments = "/flushdns",
            UseShellExecute = false,
            CreateNoWindow = true
        });
        process?.WaitForExit(5000);
    }

    private void EnforceFocus()
    {
        if (!focusEnabled) return;
        var hwnd = NativeMethods.GetForegroundWindow();
        if (hwnd == IntPtr.Zero) return;
        var title = new StringBuilder(512);
        NativeMethods.GetWindowText(hwnd, title, title.Capacity);
        var text = title.ToString();
        if (text.Contains("porn", StringComparison.OrdinalIgnoreCase) ||
            text.Contains("xxx", StringComparison.OrdinalIgnoreCase))
        {
            NativeMethods.ShowWindow(hwnd, NativeMethods.SW_MINIMIZE);
        }
    }

    public void Dispose()
    {
        monitorTimer.Dispose();
        tray.Visible = false;
        tray.Dispose();
        RemoveBlocklist();
    }

    private static class NativeMethods
    {
        internal const int SW_MINIMIZE = 6;
        [DllImport("user32.dll")] internal static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll", CharSet = CharSet.Unicode)] internal static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
        [DllImport("user32.dll")] internal static extern bool ShowWindow(IntPtr hWnd, int command);
    }
}
