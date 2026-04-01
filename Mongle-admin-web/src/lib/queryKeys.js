export const queryKeys = {
  projects: ['projects'],
  project: (projectId) => ['project', projectId],

  timelines: (projectId) => ['timelines', projectId],
  timeline: (timelineId) => ['timeline', timelineId],

  budgets: (projectId) => ['budgets', projectId],
  budget: (budgetId) => ['budget', budgetId],

  vendors: (projectId) => ['vendors', projectId],
  vendor: (vendorId) => ['vendor', vendorId],

  chats: (projectId) => ['chats', projectId],
  chatMessages: (chatId) => ['chatMessages', chatId],
};