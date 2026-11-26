import test from 'node:test';
import assert from 'node:assert/strict';
import {educationValue,educationLabel} from './educationPresentation.js';
test('Vietnamese, English and canonical levels have friendly labels',()=>{
  for(const value of ['Đại học','dai hoc','Bachelor of Science','Kỹ sư','B.Eng.','UNIVERSITY'])assert.equal(educationValue(value),'UNIVERSITY');
  assert.equal(educationValue('Associate Degree'),'COLLEGE');assert.equal(educationLabel('PhD'),'Tiến sĩ');
  assert.equal(educationValue('MSc'),'MASTER');assert.equal(educationLabel('NONE'),'Không yêu cầu');
  assert.equal(educationValue(null),'NONE');
});
test('Legacy custom requirement survives editing instead of being silently cleared',()=>{
  assert.equal(educationValue('Công nghệ thông tin'),'Công nghệ thông tin');
  assert.equal(educationLabel('Công nghệ thông tin'),'Công nghệ thông tin');
});
