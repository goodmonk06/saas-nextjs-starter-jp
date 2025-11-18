/**
 * Domain Events
 *
 * Typed events that can be emitted throughout the application
 * Handlers can be registered to respond to these events asynchronously
 */

export interface BaseDomainEvent {
  type: string
  timestamp: Date
  userId?: string
  organizationId?: string
  metadata?: Record<string, any>
}

// User Events
export interface UserCreatedEvent extends BaseDomainEvent {
  type: 'user.created'
  userId: string
  email: string
  name?: string
}

export interface UserUpdatedEvent extends BaseDomainEvent {
  type: 'user.updated'
  userId: string
  changes: Record<string, any>
}

export interface UserDeletedEvent extends BaseDomainEvent {
  type: 'user.deleted'
  userId: string
}

export interface UserLoginEvent extends BaseDomainEvent {
  type: 'user.login'
  userId: string
  ipAddress?: string
  userAgent?: string
}

// Organization Events
export interface OrganizationCreatedEvent extends BaseDomainEvent {
  type: 'organization.created'
  organizationId: string
  name: string
  slug: string
  createdBy: string
}

export interface OrganizationUpdatedEvent extends BaseDomainEvent {
  type: 'organization.updated'
  organizationId: string
  changes: Record<string, any>
}

export interface OrganizationDeletedEvent extends BaseDomainEvent {
  type: 'organization.deleted'
  organizationId: string
}

// Member Events
export interface MemberAddedEvent extends BaseDomainEvent {
  type: 'organization.member.added'
  organizationId: string
  userId: string
  role: string
  addedBy: string
}

export interface MemberRemovedEvent extends BaseDomainEvent {
  type: 'organization.member.removed'
  organizationId: string
  userId: string
  removedBy: string
}

export interface MemberRoleChangedEvent extends BaseDomainEvent {
  type: 'organization.member.role_changed'
  organizationId: string
  userId: string
  oldRole: string
  newRole: string
  changedBy: string
}

// Invitation Events
export interface InvitationSentEvent extends BaseDomainEvent {
  type: 'invitation.sent'
  organizationId: string
  email: string
  role: string
  invitedBy: string
  invitationId: string
}

export interface InvitationAcceptedEvent extends BaseDomainEvent {
  type: 'invitation.accepted'
  organizationId: string
  userId: string
  invitationId: string
}

export interface InvitationRevokedEvent extends BaseDomainEvent {
  type: 'invitation.revoked'
  organizationId: string
  invitationId: string
  revokedBy: string
}

// API Key Events
export interface ApiKeyCreatedEvent extends BaseDomainEvent {
  type: 'api_key.created'
  apiKeyId: string
  userId?: string
  organizationId?: string
  name: string
}

export interface ApiKeyRevokedEvent extends BaseDomainEvent {
  type: 'api_key.revoked'
  apiKeyId: string
  revokedBy: string
}

export interface ApiKeyUsedEvent extends BaseDomainEvent {
  type: 'api_key.used'
  apiKeyId: string
  endpoint: string
}

// Subscription Events
export interface SubscriptionCreatedEvent extends BaseDomainEvent {
  type: 'subscription.created'
  userId?: string
  organizationId?: string
  plan: string
  stripeSubscriptionId: string
}

export interface SubscriptionUpdatedEvent extends BaseDomainEvent {
  type: 'subscription.updated'
  userId?: string
  organizationId?: string
  oldPlan: string
  newPlan: string
}

export interface SubscriptionCancelledEvent extends BaseDomainEvent {
  type: 'subscription.cancelled'
  userId?: string
  organizationId?: string
  plan: string
}

// Union type of all events
export type DomainEvent =
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserDeletedEvent
  | UserLoginEvent
  | OrganizationCreatedEvent
  | OrganizationUpdatedEvent
  | OrganizationDeletedEvent
  | MemberAddedEvent
  | MemberRemovedEvent
  | MemberRoleChangedEvent
  | InvitationSentEvent
  | InvitationAcceptedEvent
  | InvitationRevokedEvent
  | ApiKeyCreatedEvent
  | ApiKeyRevokedEvent
  | ApiKeyUsedEvent
  | SubscriptionCreatedEvent
  | SubscriptionUpdatedEvent
  | SubscriptionCancelledEvent
