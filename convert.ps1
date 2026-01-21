Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("public\icon.png")
$img.Save("public\icon-fixed.png", [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
