export const PROJECT_LEADS = [
  'John Smith',
  'Jane Doe', 
  'Mike Johnson'
] as const;

export type ProjectLead = typeof PROJECT_LEADS[number];

export const isValidProjectLead = (lead: string): lead is ProjectLead => {
  return PROJECT_LEADS.includes(lead as ProjectLead);
}; 