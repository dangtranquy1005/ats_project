$ErrorActionPreference='Stop'
$taskBase='http://127.0.0.1:8083/api/v1'
$taskReady=$false
for($taskAttempt=0;$taskAttempt -lt 30;$taskAttempt++){
  try { $taskProbe=Invoke-WebRequest -Uri 'http://127.0.0.1:8083/v3/api-docs' -TimeoutSec 2 -SkipHttpErrorCheck; if($taskProbe.StatusCode -eq 200){$taskReady=$true;break} } catch {}
  Start-Sleep -Seconds 1
}
if(!$taskReady){throw 'Demo backend not ready'}
$taskEmail='auto-score-fixture-20261126@example.invalid'
$taskCvId=$null
$taskJobId=$null
Invoke-RestMethod -Method Post -Uri "$taskBase/user/create" -ContentType application/json -Body (@{fullname='Auto scoring fixture';email=$taskEmail;password='AutoScoreFixture2026!'}|ConvertTo-Json)|Out-Null
$taskLogin=Invoke-RestMethod -Method Post -Uri "$taskBase/user/login" -ContentType application/json -Body (@{email=$taskEmail;password='AutoScoreFixture2026!'}|ConvertTo-Json)
$taskHeaders=@{Authorization="Bearer $($taskLogin.result.token)"}
try {
  $taskSkills=Invoke-RestMethod -Uri "$taskBase/skills?query=Java" -Headers $taskHeaders
  $taskJava=$taskSkills|Where-Object canonicalName -eq Java|Select-Object -First 1
  $taskJob=Invoke-RestMethod -Method Post -Uri "$taskBase/jobs" -Headers $taskHeaders -ContentType application/json -Body (@{title='Auto scoring fixture';description='Java REST API backend';minExperienceYears=0;educationRequirements='NONE';requiredSkills=@(@{skillId=$taskJava.skillId;mandatory=$true;weight=1})}|ConvertTo-Json -Depth 5)
  $taskJobId=$taskJob.jobId
  Invoke-RestMethod -Method Put -Uri "$taskBase/jobs/$taskJobId/scoring-config" -Headers $taskHeaders -ContentType application/json -Body '{"jaccardWeight":1,"cosineWeight":0,"educationWeight":0}'|Out-Null
  $taskUpload=Invoke-RestMethod -Method Post -Uri "$taskBase/cvs/upload" -Headers $taskHeaders -Form @{jobId=[string]$taskJobId;files=(Get-Item output/pdf/ats-demo-detailed/cv/CV01.pdf)}
  $taskCvId=$taskUpload[0].cvId
  $taskDeadline=(Get-Date).AddSeconds(60)
  do {
    $taskStatus=Invoke-RestMethod -Uri "$taskBase/cvs/$taskCvId/status" -Headers $taskHeaders
    if($taskStatus.status -eq 'PARSED_FAILED'){throw 'Fixture NLP failed'}
    if($taskStatus.status -eq 'SCORED'){break}
    Start-Sleep -Seconds 1
  } while((Get-Date)-lt $taskDeadline)
  if($taskStatus.status -ne 'SCORED'){throw 'Automatic scoring did not complete in time'}
  $taskFirst=Invoke-RestMethod -Uri "$taskBase/cvs/$taskCvId/match" -Headers $taskHeaders
  if($taskFirst.overallScore -ne 1){throw 'Unexpected first score'}
  Invoke-RestMethod -Method Put -Uri "$taskBase/cvs/$taskCvId/review" -Headers $taskHeaders -ContentType application/json -Body '{"reviewStatus":"SHORTLISTED","note":"Keep this HR note","expectedVersion":0}'|Out-Null
  Invoke-RestMethod -Method Put -Uri "$taskBase/jobs/$taskJobId/scoring-config" -Headers $taskHeaders -ContentType application/json -Body '{"jaccardWeight":0.5,"cosineWeight":0.5,"educationWeight":0}'|Out-Null
  $taskDeadline=(Get-Date).AddSeconds(30);$taskSecond=$null
  do {
    $taskResponse=Invoke-WebRequest -Uri "$taskBase/cvs/$taskCvId/match" -Headers $taskHeaders -SkipHttpErrorCheck
    if($taskResponse.StatusCode -eq 200){$taskCandidate=$taskResponse.Content|ConvertFrom-Json;if($taskCandidate.weights.skill -eq 0.5){$taskSecond=$taskCandidate;break}}
    Start-Sleep -Seconds 1
  } while((Get-Date)-lt $taskDeadline)
  if(!$taskSecond){throw 'Criteria change was not automatically rescored'}
  $taskReview=Invoke-RestMethod -Uri "$taskBase/cvs/$taskCvId/review" -Headers $taskHeaders
  if($taskReview.note -ne 'Keep this HR note' -or $taskReview.reviewStatus -ne 'SHORTLISTED'){throw 'HR review changed unexpectedly'}
  $taskRank=Invoke-RestMethod -Uri "$taskBase/jobs/$taskJobId/ranking" -Headers $taskHeaders
  if($taskRank.totalElements -ne 1){throw 'Ranking missing auto-scored CV'}
  @{result='PASS';rescoreApiCalled=$false;status=$taskStatus.status;firstScore=$taskFirst.overallScore;updatedScore=$taskSecond.overallScore;reviewPreserved=$true;rankingCount=$taskRank.totalElements}|ConvertTo-Json|Set-Content -Encoding utf8 output/auto-score-live-result.json
  Get-Content output/auto-score-live-result.json
} finally {
  if($taskCvId){Invoke-RestMethod -Method Delete -Uri "$taskBase/cvs/$taskCvId" -Headers $taskHeaders|Out-Null}
  docker compose --env-file .env.demo -f compose.demo.yaml exec -T db psql -U ats -d ats_demo -v ON_ERROR_STOP=1 -c "BEGIN; DELETE FROM tbl_job_required_skill WHERE job_posting_id IN(SELECT j.job_id FROM tbl_job j JOIN tbl_users u ON u.id=j.user_id WHERE u.email='auto-score-fixture-20261126@example.invalid' AND u.full_name='Auto scoring fixture'); DELETE FROM tbl_job WHERE user_id IN(SELECT id FROM tbl_users WHERE email='auto-score-fixture-20261126@example.invalid' AND full_name='Auto scoring fixture'); DELETE FROM tbl_users WHERE email='auto-score-fixture-20261126@example.invalid' AND full_name='Auto scoring fixture'; COMMIT;"
}
