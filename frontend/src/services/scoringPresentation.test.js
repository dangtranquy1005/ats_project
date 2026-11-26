import test from 'node:test';
import assert from 'node:assert/strict';
import {score100,rankingParams} from './scoringPresentation.js';
const form={query:'',sortBy:'OVERALL_SCORE',sortOrder:'DESC',minScore:'',maxScore:'',passed:''};
test('API fractional scores preserve zero and present percentages without turning null into zero',()=>{
  assert.equal(score100(0),'0.0'); assert.equal(score100(0.875),'87.5'); assert.equal(score100(1),'100.0');
  assert.equal(score100(null),'—'); assert.equal(score100(undefined),'—');
});
test('UI range 0..100 maps to API 0..1, empty range stays absent, false hard-filter stays false',()=>{
  const params=rankingParams({...form,minScore:'0',maxScore:'80',passed:'false',query:'  Nguyen  '});
  assert.equal(params.minScore,0); assert.equal(params.maxScore,0.8); assert.equal(params.passedHardFilter,false); assert.equal(params.query,'Nguyen');
  assert.equal(Object.hasOwn(rankingParams(form),'minScore'),false);
});
test('bad or reversed score ranges are rejected before making a request',()=>{
  for(const minScore of ['101','-1','NaN','Infinity']) assert.throws(()=>rankingParams({...form,minScore}));
  assert.throws(()=>rankingParams({...form,minScore:'90',maxScore:'50'}));
});
test('review filter combines with scoring filters and is omitted when reset',()=>{
  const params=rankingParams({...form,reviewStatus:'SHORTLISTED',passed:'false',minScore:'50'});
  assert.equal(params.reviewStatus,'SHORTLISTED'); assert.equal(params.passedHardFilter,false);
  assert.equal(params.minScore,0.5);
  assert.equal(Object.hasOwn(rankingParams({...form,reviewStatus:''}),'reviewStatus'),false);
});
