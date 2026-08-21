var LEAD_HEADERS_ = ['lead_id','assessment_id','created_at','first_name','last_name','phone','risk_percent','risk_level','package_id','lead_intent','lead_status','owner','last_contact_at','next_followup_at','appointment_date','visit_status','purchase_status','revenue','remark'];

function createLead_(payload) {
  validateLead_(payload); var id = createId_('LEAD');
  appendObjectRow_('Leads', LEAD_HEADERS_, { lead_id:id, assessment_id:payload.assessment_id, created_at:new Date().toISOString(), first_name:cleanText_(payload.first_name,100), last_name:cleanText_(payload.last_name,100), phone:String(payload.phone||'').replace(/[\s-]/g,''), risk_percent:numberOrBlank_(payload.risk_percent), risk_level:cleanText_(payload.risk_level,30), package_id:cleanText_(payload.package_id,50), lead_intent:payload.lead_intent, lead_status:'New', owner:'', last_contact_at:'', next_followup_at:'', appointment_date:'', visit_status:'', purchase_status:'', revenue:'', remark:'' });
  return { lead_id:id, status:'New' };
}
