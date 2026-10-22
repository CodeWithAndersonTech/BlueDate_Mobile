let activeConversationId: number | null = null;

export function setActiveConversationId(id: number | null) {
  activeConversationId = id && Number.isFinite(id) ? id : null;
}

export function getActiveConversationId() {
  return activeConversationId;
}
