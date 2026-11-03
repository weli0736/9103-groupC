Add-Type -AssemblyName System.Drawing
$data = Get-Content (Join-Path $PSScriptRoot 'points.json') -Raw | ConvertFrom-Json
$bmp = New-Object System.Drawing.Bitmap 1440,900
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(38,38,38))
$g.SmoothingMode = 'AntiAlias'
$font = New-Object System.Drawing.Font 'Arial',9
$title = New-Object System.Drawing.Font 'Arial',16
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Lime),2
$jointPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Red),3
$index=0
foreach ($side in @('left','right')) {
  $letter = if ($side -eq 'left') {'L'} else {'R'}
  $x0=20+$index*720; $y0=60; $w=680; $h=778
  $img=[System.Drawing.Image]::FromFile((Join-Path $PSScriptRoot "../../photo/dragon $letter.png"))
  $g.DrawImage($img,$x0,$y0,$w,$h)
  $g.DrawString("$letter - source orientation | green: torso | red: joints",$title,[System.Drawing.Brushes]::White,$x0,20)
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
    $nodes = @(,$limb.root) + @($limb.tips)
    foreach ($edge in $limb.connections) {
      $a=$nodes[$edge[0]]; $b=$nodes[$edge[1]]
      $g.DrawLine($jointPen,[single]($x0+$a[0]*$w),[single]($y0+$a[1]*$h),[single]($x0+$b[0]*$w),[single]($y0+$b[1]*$h))
    }
    foreach ($node in $nodes) {
      $tx=$x0+$node[0]*$w; $ty=$y0+$node[1]*$h
      $g.FillEllipse([System.Drawing.Brushes]::Red,[single]($tx-5),[single]($ty-5),10,10)
    }
  }
  $img.Dispose();$index++
}
$bmp.Save((Join-Path $PSScriptRoot '06-red-line-controls.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose();$bmp.Dispose();$font.Dispose();$title.Dispose();$pen.Dispose();$jointPen.Dispose()



