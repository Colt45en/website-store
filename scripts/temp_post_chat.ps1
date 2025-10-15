$r = Invoke-RestMethod -Uri 'http://localhost:4000/api/auth/demo' -Method Post
$token = $r.token
Write-Output "Got token for user id: $($r.user.id)"
$payload = @{ 
  conversation = @(
    @{ 
      ts = [int][double]::Parse((Get-Date -UFormat %s))
      role = 'user'
      text = 'Test message from PowerShell script'
    }
  )
  unread = 1
}
$json = $payload | ConvertTo-Json -Depth 10
try {
  $response = Invoke-RestMethod -Uri 'http://localhost:4000/api/chat' -Method Post -Headers @{ Authorization = "Bearer $token" } -Body $json -ContentType 'application/json' -ErrorAction Stop
  Write-Output 'Server response:'
  $response | ConvertTo-Json -Depth 5
} catch {
  Write-Output 'POST failed'
  Write-Output $_.Exception.Message
  if ($_.Exception.Response) {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    Write-Output 'HTTP response body:'
    Write-Output $body
  }
}
Write-Output 'mockdb.json content:'
Get-Content 'C:\Users\colte\nova-store\server\mockdb.json' -Raw
