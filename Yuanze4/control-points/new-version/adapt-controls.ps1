$p = Get-Content control-points/points.json -Raw | ConvertFrom-Json
# 新版轮廓上的关节根部和末端（原图方向、归一化坐标）。
$p.left.limbs[0].root = @(0.60,0.15); $p.left.limbs[0].tips = @(@(0.74,0.09),@(0.86,0.045))
$p.right.limbs[0].root = @(0.40,0.15); $p.right.limbs[0].tips = @(@(0.26,0.09),@(0.14,0.045))
$p.left.limbs[1].root = @(0.17,0.76); $p.left.limbs[1].tips = @(@(0.10,0.65),@(0.14,0.565))
$p.right.limbs[1].root = @(0.83,0.76); $p.right.limbs[1].tips = @(@(0.90,0.65),@(0.86,0.565))
$p.left.limbs[2].root = @(0.35,0.77); $p.left.limbs[2].tips = ,@(0.28,0.735)
$p.right.limbs[2].root = @(0.65,0.77); $p.right.limbs[2].tips = ,@(0.72,0.735)
$p.left.limbs[3].root = @(0.56,0.74); $p.left.limbs[3].tips = ,@(0.60,0.69)
$p.right.limbs[3].root = @(0.44,0.74); $p.right.limbs[3].tips = ,@(0.40,0.69)
$p.left.limbs[4].root = @(0.80,0.70); $p.left.limbs[4].tips = @(@(0.82,0.80),@(0.91,0.78))
$p.right.limbs[4].root = @(0.20,0.70); $p.right.limbs[4].tips = @(@(0.18,0.80),@(0.09,0.78))
$p.left.limbs[5].tips = @(@(0.045,0.145),@(0.095,0.115))
$p.right.limbs[5].tips = @(@(0.955,0.145),@(0.905,0.115))
$p.left.limbs[6].tips = @(@(0.63,0.30),@(0.65,0.40))
$p.right.limbs[6].tips = @(@(0.37,0.30),@(0.35,0.40))
$p.left.limbs[7].root = @(0.94,0.40); $p.left.limbs[7].tips = @(@(0.82,0.35),@(0.81,0.29))
$p.right.limbs[7].root = @(0.06,0.40); $p.right.limbs[7].tips = @(@(0.18,0.35),@(0.19,0.29))
# 翼面保护轮廓也随新版羽翼调整。
$p.left.limbs[5].outline = @(@(0.40,0.44),@(0.42,0.34),@(0.27,0.28),@(0.095,0.115),@(0.045,0.145),@(0.04,0.26),@(0.12,0.38),@(0.29,0.46))
$p.right.limbs[5].outline = @(@(0.60,0.44),@(0.58,0.34),@(0.73,0.28),@(0.905,0.115),@(0.955,0.145),@(0.96,0.26),@(0.88,0.38),@(0.71,0.46))
$p | ConvertTo-Json -Depth 30 | Set-Content control-points/new-version/points.json -Encoding utf8
$s=Get-Content audio-change.js -Raw
$torso=@{}; $pins=@{}; $limbs=@{}
foreach($side in @('left','right')) {
  $torso[$side]=@($p.$side.body[0..55] | ForEach-Object { ,@($_[0],$_[1]) })
  $pins[$side]=@($p.$side.body[56..58])
  $limbs[$side]=$p.$side.limbs
}
foreach($entry in @(@('DRAGON_TORSO_PATHS',$torso),@('DRAGON_PINS',$pins),@('DRAGON_LIMBS',$limbs))) {
  $json=ConvertTo-Json -InputObject $entry[1] -Depth 30 -Compress
  $pattern='(?s)  const '+$entry[0]+' = \{.*?\r?\n  \};'
  $replacement='  const '+$entry[0]+' = '+$json+';'
  $s=[regex]::Replace($s,$pattern,[System.Text.RegularExpressions.MatchEvaluator]{param($m) $replacement})
}
Set-Content audio-change.js $s -Encoding utf8
$r=Get-Content control-points/new-version/render-controls.ps1 -Raw
$r=$r.Replace("'../points.json'","'points.json'")
Set-Content control-points/new-version/render-controls.ps1 $r -Encoding utf8

