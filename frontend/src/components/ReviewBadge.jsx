import React from 'react';
import {REVIEW_STATES,REVIEW_COLORS} from '../services/reviewPresentation';

export default function ReviewBadge({status='PENDING'}) {
  return <span className={`inline-block text-xs px-2 py-1 rounded-full whitespace-nowrap ${REVIEW_COLORS[status]||REVIEW_COLORS.PENDING}`}>{REVIEW_STATES[status]||REVIEW_STATES.PENDING}</span>;
}
