Add-Type -AssemblyName System.Drawing
$data = Get-Content (Join-Path $PSScriptRoot 'points.json') -Raw | ConvertFrom-Json
$bmp = New-Object System.Drawing.Bitmap 1440,900
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(38,38,38))
$g.SmoothingMode = 'AntiAlias'
$font = New-Object System.Drawing.Font 'Arial',9
$title = New-Object System.Drawing.Font 'Arial',16
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Lime),2
$jointPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Orange),2
$index=0
foreach ($side in @('left','right')) {
  $letter = if ($side -eq 'left') {'L'} else {'R'}
  $x0=20+$index*720; $y0=60; $w=680; $h=778
  $img=[System.Drawing.Image]::FromFile((Join-Path $PSScriptRoot "../../photo/dragon $letter.png"))
  $g.DrawImage($img,$x0,$y0,$w,$h)
  $g.DrawString("$letter - source orientation | green: torso | orange: joints",$title,[System.Drawing.Brushes]::White,$x0,20)
  $points=$data.$side.body
  for ($i=0;$i -lt 56;$i++) {
    $x=$x0+$points[$i][0]*$w; $y=$y0+$points[$i][1]*$h
    if ($i -gt 0) { $g.DrawLine($pen,[single]$px,[single]$py,[single]$x,[single]$y) }
    $g.FillEllipse([System.Drawing.Brushes]::Lime,[single]($x-3),[single]($y-3),6,6)
    $g.DrawString(('B{0:00}' -f ($i+1)),$font,[System.Drawing.Brushes]::Black,[single]($x+4),[single]($y-11))
    $px=$x;$py=$y
  }
  $j=0
  foreach ($limb in $data.$side.limbs) {
    $j++
    $rx=$x0+$limb.root[0]*$w;$ry=$y0+$limb.root[1]*$h
    $g.DrawEllipse($jointPen,[single]($rx-5),[single]($ry-5),10,10)
    foreach ($tip in $limb.tips) {
      $tx=$x0+$tip[0]*$w;$ty=$y0+$tip[1]*$h
      $g.DrawLine($jointPen,[single]$rx,[single]$ry,[single]$tx,[single]$ty)
      $g.FillEllipse([System.Drawing.Brushes]::Orange,[single]($tx-4),[single]($ty-4),8,8)
      $g.DrawString("J$j",$font,[System.Drawing.Brushes]::DarkRed,[single]($tx+5),[single]$ty)
    }
  }
  $img.Dispose();$index++
}
$bmp.Save((Join-Path $PSScriptRoot '05-new-dragon-controls.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose();$bmp.Dispose();$font.Dispose();$title.Dispose();$pen.Dispose();$jointPen.Dispose()

