# Append a message to user:1 chat and then mark read
$r = Invoke-RestMethod -Uri 'http://localhost:4000/api/auth/demo' -Method Post
$token = $r.token
Write-Output "Using token for user id: $($r.user.id)"
$append = @{ item = @{ ts = [int][double]::Parse((Get-Date -UFormat %s)); role = 'bot'; text = 'Appended by test script' }; incr = 1 }
$json = $append | ConvertTo-Json -Depth 10
$response = Invoke-RestMethod -Uri 'http://localhost:4000/api/chat/append' -Method Post -Headers @{ Authorization = "Bearer $token" } -Body $json -ContentType 'application/json'
Write-Output "Append response:"; $response | ConvertTo-Json -Depth 5
# mark read
$response2 = Invoke-RestMethod -Uri 'http://localhost:4000/api/chat/mark-read' -Method Post -Headers @{ Authorization = "Bearer $token" }
Write-Output "Mark-read response:"; $response2 | ConvertTo-Json -Depth 5
Write-Output 'mockdb.json now:'
Get-Content 'C:\Users\colte\nova-store\server\mockdb.json' -Raw
