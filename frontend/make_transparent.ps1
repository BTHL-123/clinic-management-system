Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("C:\Users\Admin\.gemini\antigravity-ide\brain\e3d35b77-6d5f-4439-a1e2-62a23a9f67b8\medical_clinic_logo_1780662424486.png")
$img.MakeTransparent([System.Drawing.Color]::White)
$img.Save("d:\FPT Materials\SWP391\clinic-management-system\frontend\public\logo-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
