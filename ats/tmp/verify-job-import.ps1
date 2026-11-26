$ErrorActionPreference='Stop'
$taskBase='http://127.0.0.1:8083/api/v1'
$taskEmail='jd-import-fixture-20261126@example.invalid'
Invoke-RestMethod -Method Post -Uri "$taskBase/user/create" -ContentType application/json -Body (@{fullname='JD import fixture';email=$taskEmail;password='JdImportFixture2026!'}|ConvertTo-Json) | Out-Null
$taskLogin=Invoke-RestMethod -Method Post -Uri "$taskBase/user/login" -ContentType application/json -Body (@{email=$taskEmail;password='JdImportFixture2026!'}|ConvertTo-Json)
$taskHeaders=@{Authorization="Bearer $($taskLogin.result.token)"}
$taskResults=@()
try {
  foreach($taskCode in @('JD01','JD02','JD03')) {
    $taskDraft=Invoke-RestMethod -Method Post -Uri "$taskBase/jobs/import-pdf" -Headers $taskHeaders -Form @{file=(Get-Item "output/pdf/ats-demo-detailed/jd/$taskCode.pdf")}
    if(!$taskDraft.title -or !$taskDraft.requiredSkills.Count){throw "Missing draft fields: $taskCode"}
    $taskResults+=@{file=$taskCode;draft=$taskDraft}
    Write-Output "$taskCode title=$($taskDraft.title); years=$($taskDraft.minExperienceYears); education=$($taskDraft.educationRequirements); skills=$($taskDraft.requiredSkills.Count)"
  }
  $taskAfter=Invoke-RestMethod -Uri "$taskBase/jobs" -Headers $taskHeaders
  if($taskAfter.totalElements -ne 0){throw 'Preview unexpectedly created jobs'}
  $taskScan=Invoke-WebRequest -Method Post -Uri "$taskBase/jobs/import-pdf" -Headers $taskHeaders -Form @{file=(Get-Item output/pdf/ats-demo-detailed/cv/CV10.pdf)} -SkipHttpErrorCheck
  if($taskScan.StatusCode -ne 422){throw 'Scan case did not return 422'}
  $taskResults|ConvertTo-Json -Depth 10|Set-Content -Encoding utf8 output/job-import-real-drafts.json
  Write-Output 'PASS: 3 PDFs analyzed, 0 jobs saved, image-only PDF rejected (422).'
} finally {
  docker compose --env-file .env.demo -f compose.demo.yaml exec -T db psql -U ats -d ats_demo -v ON_ERROR_STOP=1 -c "DELETE FROM tbl_users u WHERE u.email='jd-import-fixture-20261126@example.invalid' AND u.full_name='JD import fixture' AND NOT EXISTS(SELECT 1 FROM tbl_job j WHERE j.user_id=u.id);"
}
