import * as Types from './types/settings'
import HiddenString from '../util/hidden-string'
import {TypedState} from './reducer'
import * as I from 'immutable'
import * as WaitingConstants from './waiting'
import {getMeta} from './chat2/meta'
import * as RPCTypes from './types/rpc-gen'
import {e164ToDisplay} from '../util/phone-numbers'
import {RPCError} from 'util/errors'

export const makeNotificationsGroup = I.Record<Types._NotificationsGroupState>({
  settings: I.List(),
  unsubscribedFromAll: false,
})

export const makeNotifications = I.Record<Types._NotificationsState>({
  allowEdit: false,
  groups: I.Map(),
})

export const makeUnfurl = I.Record<Types._ChatUnfurlState>({
  unfurlError: undefined,
  unfurlMode: undefined,
  unfurlWhitelist: I.List(),
})

export const makeChat = I.Record<Types._ChatState>({
  unfurl: makeUnfurl(),
})

export const makeEmail = I.Record<Types._EmailState>({
  addedEmail: null,
  addingEmail: null,
  emails: null,
  error: '',
  newEmail: '',
})

export const makeEmailRow = I.Record<Types._EmailRow>({
  email: '',
  isPrimary: false,
  isVerified: false,
  lastVerifyEmailDate: 0,
  visibility: 0,
})

export const makePhoneRow = I.Record<Types._PhoneRow>({
  displayNumber: '',
  e164: '',
  searchable: false,
  superseded: false,
  verified: false,
})

export const toPhoneRow = (p: RPCTypes.UserPhoneNumber) =>
  makePhoneRow({
    displayNumber: e164ToDisplay(p.phoneNumber),
    e164: p.phoneNumber,
    searchable: p.visibility === RPCTypes.IdentityVisibility.public,
    superseded: p.superseded,
    verified: p.verified,
  })

export const makeFeedback = I.Record<Types._FeedbackState>({
  error: null,
})

export const makeInvites = I.Record<Types._InvitesState>({
  acceptedInvites: I.List(),
  error: null,
  pendingInvites: I.List(),
})

export const makePassword = I.Record<Types._PasswordState>({
  error: null,
  hasPGPKeyOnServer: null,
  newPassword: new HiddenString(''),
  newPasswordConfirm: new HiddenString(''),
  newPasswordConfirmError: null,
  newPasswordError: null,
  randomPW: null,
  rememberPassword: true,
})

export const makePhoneNumbers = I.Record<Types._PhoneNumbersState>({
  addedPhone: false,
  error: '',
  pendingVerification: '',
  phones: null,
  verificationState: null,
})

export const makeContacts = I.Record<Types._ContactsState>({
  importEnabled: null,
  importError: '',
  importPromptDismissed: false,
  importedCount: null,
  permissionStatus: 'unknown',
  userCountryCode: null,
})

export const makeState = I.Record<Types._State>({
  allowDeleteAccount: false,
  chat: makeChat(),
  checkPasswordIsCorrect: null,
  contacts: makeContacts(),
  didToggleCertificatePinning: null,
  email: makeEmail(),
  feedback: makeFeedback(),
  invites: makeInvites(),
  lockdownModeEnabled: null,
  notifications: makeNotifications(),
  password: makePassword(),
  phoneNumbers: makePhoneNumbers(),
  proxyData: null,
})

export const getPushTokenForLogSend = (state: TypedState) => ({pushToken: state.push.token})

export const getExtraChatLogsForLogSend = (state: TypedState) => {
  const chat = state.chat2
  const c = state.chat2.selectedConversation
  if (c) {
    const metaMap = getMeta(state, c).toJS()
    return I.Map({
      badgeMap: chat.badgeMap.get(c),
      editingMap: chat.editingMap.get(c),
      // @ts-ignore
      messageMap: chat.messageMap.get(c, I.Map()).map(m => ({
        a: m.author,
        i: m.id,
        o: m.ordinal,
        out: (m.type === 'text' || m.type === 'attachment') && m.outboxID,
        s: (m.type === 'text' || m.type === 'attachment') && m.submitState,
        t: m.type,
      })),
      messageOrdinals: chat.messageOrdinals.get(c),
      metaMap: {
        channelname: 'x',
        conversationIDKey: metaMap.conversationIDKey,
        description: 'x',
        inboxVersion: metaMap.inboxVersion,
        isMuted: metaMap.isMuted,
        membershipType: metaMap.membershipType,
        notificationsDesktop: metaMap.notificationsDesktop,
        notificationsGlobalIgnoreMentions: metaMap.notificationsGlobalIgnoreMentions,
        notificationsMobile: metaMap.notificationsMobile,
        offline: metaMap.offline,
        participants: 'x',
        rekeyers: metaMap.rekeyers && metaMap.rekeyers.size,
        resetParticipants: metaMap.resetParticipants && metaMap.resetParticipants.size,
        retentionPolicy: metaMap.retentionPolicy,
        snippet: 'x',
        snippetDecoration: 'x',
        supersededBy: metaMap.supersededBy,
        supersedes: metaMap.supersedes,
        teamRetentionPolicy: metaMap.teamRetentionPolicy,
        teamType: metaMap.teamType,
        teamname: metaMap.teamname,
        timestamp: metaMap.timestamp,
        tlfname: metaMap.tlfname,
        trustedState: metaMap.trustedState,
        wasFinalizedBy: metaMap.wasFinalizedBy,
      },
      pendingOutboxToOrdinal: chat.pendingOutboxToOrdinal.get(c),
      quote: chat.quote,
      unreadMap: chat.unreadMap.get(c),
    }).toJS()
  }
  return {}
}

export const makePhoneError = (e: RPCError) => {
  switch (e.code) {
    case RPCTypes.StatusCode.scphonenumberwrongverificationcode:
      return 'Incorrect code, please try again.'
    case RPCTypes.StatusCode.scphonenumberunknown:
      return e.desc
    case RPCTypes.StatusCode.scphonenumberalreadyverified:
      return 'This phone number is already verified.'
    case RPCTypes.StatusCode.scphonenumberverificationcodeexpired:
      return 'Verification code expired, resend and try again.'
    case RPCTypes.StatusCode.scratelimit:
      return 'Sorry, tried too many guesses in a short period of time. Please try again later.'
    default:
      return e.message
  }
}

export const makeAddEmailError = (err: RPCError): string => {
  switch (err.code) {
    case RPCTypes.StatusCode.scratelimit:
      return "Sorry, you've added too many email addresses lately. Please try again later."
    case RPCTypes.StatusCode.scemailtaken:
      return 'This email is already claimed by another user.'
    case RPCTypes.StatusCode.scemaillimitexceeded:
      return 'You have too many emails, delete one and try again.'
    case RPCTypes.StatusCode.scinputerror:
      return 'Invalid email.'
  }
  return err.message
}
export const securityGroup = 'security'
export const traceInProgressKey = 'settings:traceInProgress'
export const traceInProgress = (state: TypedState) => WaitingConstants.anyWaiting(state, traceInProgressKey)
export const processorProfileInProgressKey = 'settings:processorProfileInProgress'
export const processorProfileInProgress = (state: TypedState) =>
  WaitingConstants.anyWaiting(state, processorProfileInProgressKey)
export const importContactsConfigKey = (username: string) => `ui.importContacts.${username}`

export const refreshNotificationsWaitingKey = 'settingsTabs.refreshNotifications'
export const chatUnfurlWaitingKey = 'settings:chatUnfurlWaitingKey'
export const setLockdownModeWaitingKey = 'settings:setLockdownMode'
export const loadLockdownModeWaitingKey = 'settings:loadLockdownMode'
export const checkPasswordWaitingKey = 'settings:checkPassword'
export const dontUseWaitingKey = 'settings:settingsPage'
export const sendFeedbackWaitingKey = 'settings:sendFeedback'
export const addPhoneNumberWaitingKey = 'settings:addPhoneNumber'
export const resendVerificationForPhoneWaitingKey = 'settings:resendVerificationForPhone'
export const verifyPhoneNumberWaitingKey = 'settings:verifyPhoneNumber'
export const importContactsWaitingKey = 'settings:importContacts'
export const addEmailWaitingKey = 'settings:addPhoneNumber'
export const loadSettingsWaitingKey = 'settings:loadSettings'
export const settingsWaitingKey = 'settings:generic'

export const aboutTab = 'settingsTabs.aboutTab'
export const advancedTab = 'settingsTabs.advancedTab'
export const chatTab = 'settingsTabs.chatTab'
export const deleteMeTab = 'settingsTabs.deleteMeTab'
export const devicesTab = 'settingsTabs.devicesTab'
export const feedbackTab = 'settingsTabs.feedbackTab'
export const foldersTab = 'settingsTabs.foldersTab'
export const fsTab = 'settingsTabs.fsTab'
export const gitTab = 'settingsTabs.gitTab'
export const invitationsTab = 'settingsTabs.invitationsTab'
export const accountTab = 'settingsTabs.accountTab'
export const notificationsTab = 'settingsTabs.notificationsTab'
export const passwordTab = 'settingsTabs.password'
export const screenprotectorTab = 'settingsTabs.screenprotector'
export const logOutTab = 'settingsTabs.logOutTab'
export const updatePaymentTab = 'settingsTabs.updatePaymentTab'
export const walletsTab = 'settingsTabs.walletsTab'
export const contactsTab = 'settingsTabs.contactsTab'

export type SettingsTab =
  | typeof accountTab
  | typeof updatePaymentTab
  | typeof invitationsTab
  | typeof notificationsTab
  | typeof advancedTab
  | typeof deleteMeTab
  | typeof feedbackTab
  | typeof aboutTab
  | typeof devicesTab
  | typeof gitTab
  | typeof foldersTab
  | typeof fsTab
  | typeof logOutTab
  | typeof screenprotectorTab
  | typeof passwordTab
  | typeof walletsTab
  | typeof chatTab
  | typeof contactsTab
