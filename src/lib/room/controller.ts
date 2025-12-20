// Room UI Controller
// Connects the BLoC to the DOM - handles all UI updates and event bindings

import { RoomBloc, type RoomEvent } from './bloc';
import type { Participant, VotingStatus } from './types';
import { getAvatarUrl } from './types';

// Spinner SVG for loading states (centered with flex)
const SPINNER_SVG = `<svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>`;

export class RoomController {
  private bloc: RoomBloc;
  private pendingKickParticipantId: string | null = null;
  private buttonStates: Map<HTMLElement, { html: string; disabled: boolean }> = new Map();

  // DOM Element references
  private elements: {
    // Voting
    voteCardsSection: HTMLElement | null;
    voteCards: NodeListOf<HTMLElement>;
    yourVoteDisplay: HTMLElement | null;

    // Topic
    currentTopicDisplay: HTMLElement | null;
    topicLabel: HTMLElement | null;

    // Status
    statusBanner: HTMLElement | null;
    statusText: HTMLElement | null;

    // Manager controls
    managerWaiting: HTMLElement | null;
    managerVoting: HTMLElement | null;
    managerRevealed: HTMLElement | null;
    startVotingBtn: HTMLElement | null;
    topicInput: HTMLInputElement | null;
    revealVotesBtn: HTMLElement | null;
    resetVotesBtn: HTMLElement | null;
    newRoundBtn: HTMLElement | null;
    nextTopicInput: HTMLInputElement | null;

    // Participants
    participantsList: HTMLElement | null;
    participantCount: HTMLElement | null;
    noParticipants: HTMLElement | null;

    // Results
    resultsSection: HTMLElement | null;
    voteResults: HTMLElement | null;
    voteAverage: HTMLElement | null;
    pieChart: SVGElement | null;
    pieLegend: HTMLElement | null;

    // Edit name
    editNameBtn: HTMLElement | null;
    editNameForm: HTMLFormElement | null;
    editNameInput: HTMLInputElement | null;
    cancelEditBtn: HTMLElement | null;
    currentUserName: HTMLElement | null;
    editError: HTMLElement | null;

    // Leave modal
    leaveRoomBtn: HTMLElement | null;
    leaveModal: HTMLElement | null;
    cancelLeaveBtn: HTMLElement | null;
    confirmLeaveBtn: HTMLElement | null;

    // Kick modal
    kickModal: HTMLElement | null;
    kickModalDescription: HTMLElement | null;
    cancelKickBtn: HTMLElement | null;
    confirmKickBtn: HTMLElement | null;

    // Join form
    joinForm: HTMLFormElement | null;
    joinError: HTMLElement | null;

    // Copy
    copyBtn: HTMLElement | null;
    roomUrlInput: HTMLInputElement | null;
    copyIcon: HTMLElement | null;
    checkIcon: HTMLElement | null;

    // Show votes toggle (in manager controls - will be moved to settings)
    showVotesToggle: HTMLInputElement | null;
    showVotesDescription: HTMLElement | null;

    // Settings modal
    settingsModal: HTMLElement | null;
    openSettingsBtn: HTMLElement | null;
    cancelSettingsBtn: HTMLElement | null;
    saveSettingsBtn: HTMLElement | null;
    settingsRoomName: HTMLInputElement | null;
    settingsShowVotes: HTMLInputElement | null;
    settingsShowVotesDescription: HTMLElement | null;
    voteOptionsDisplay: HTMLElement | null;
    newVoteOptionInput: HTMLInputElement | null;
    addOptionBtn: HTMLElement | null;
    roomNameDisplay: HTMLElement | null;
    voteCardsContainer: HTMLElement | null;

    // Avatar modal
    changeAvatarBtn: HTMLElement | null;
    currentUserAvatar: HTMLImageElement | null;
    avatarModal: HTMLElement | null;
    avatarPreview: HTMLImageElement | null;
    cancelAvatarBtn: HTMLElement | null;
    saveAvatarBtn: HTMLElement | null;
  };

  constructor(bloc: RoomBloc) {
    this.bloc = bloc;
    this.elements = this.queryElements();
  }

  private queryElements() {
    return {
      // Voting
      voteCardsSection: document.getElementById('vote-cards-section'),
      voteCards: document.querySelectorAll('.vote-card') as NodeListOf<HTMLElement>,
      yourVoteDisplay: document.getElementById('your-vote-display'),

      // Topic
      currentTopicDisplay: document.getElementById('current-topic-display'),
      topicLabel: document.getElementById('topic-label'),

      // Status
      statusBanner: document.getElementById('status-banner'),
      statusText: document.getElementById('status-text'),

      // Manager controls
      managerWaiting: document.getElementById('manager-waiting'),
      managerVoting: document.getElementById('manager-voting'),
      managerRevealed: document.getElementById('manager-revealed'),
      startVotingBtn: document.getElementById('start-voting-btn'),
      topicInput: document.getElementById('topic-input') as HTMLInputElement,
      revealVotesBtn: document.getElementById('reveal-votes-btn'),
      resetVotesBtn: document.getElementById('reset-votes-btn'),
      newRoundBtn: document.getElementById('new-round-btn'),
      nextTopicInput: document.getElementById('next-topic-input') as HTMLInputElement,

      // Participants
      participantsList: document.getElementById('participants-list'),
      participantCount: document.getElementById('participant-count'),
      noParticipants: document.getElementById('no-participants'),

      // Results
      resultsSection: document.getElementById('results-section'),
      voteResults: document.getElementById('vote-results'),
      voteAverage: document.getElementById('vote-average'),
      pieChart: document.getElementById('pie-chart') as unknown as SVGElement | null,
      pieLegend: document.getElementById('pie-legend'),

      // Edit name
      editNameBtn: document.getElementById('edit-name-btn'),
      editNameForm: document.getElementById('edit-name-form') as HTMLFormElement,
      editNameInput: document.getElementById('edit-name-input') as HTMLInputElement,
      cancelEditBtn: document.getElementById('cancel-edit-btn'),
      currentUserName: document.getElementById('current-user-name'),
      editError: document.getElementById('edit-error'),

      // Leave modal
      leaveRoomBtn: document.getElementById('leave-room-btn'),
      leaveModal: document.getElementById('leave-modal'),
      cancelLeaveBtn: document.getElementById('cancel-leave-btn'),
      confirmLeaveBtn: document.getElementById('confirm-leave-btn'),

      // Kick modal
      kickModal: document.getElementById('kick-modal'),
      kickModalDescription: document.getElementById('kick-modal-description'),
      cancelKickBtn: document.getElementById('cancel-kick-btn'),
      confirmKickBtn: document.getElementById('confirm-kick-btn'),

      // Join form
      joinForm: document.getElementById('join-form') as HTMLFormElement,
      joinError: document.getElementById('join-error'),

      // Copy
      copyBtn: document.getElementById('copy-btn'),
      roomUrlInput: document.getElementById('room-url') as HTMLInputElement,
      copyIcon: document.getElementById('copy-icon'),
      checkIcon: document.getElementById('check-icon'),

      // Show votes toggle
      showVotesToggle: document.getElementById('show-votes-toggle') as HTMLInputElement,
      showVotesDescription: document.getElementById('show-votes-description'),

      // Settings modal
      settingsModal: document.getElementById('settings-modal'),
      openSettingsBtn: document.getElementById('open-settings-btn'),
      cancelSettingsBtn: document.getElementById('cancel-settings-btn'),
      saveSettingsBtn: document.getElementById('save-settings-btn'),
      settingsRoomName: document.getElementById('settings-room-name') as HTMLInputElement,
      settingsShowVotes: document.getElementById('settings-show-votes') as HTMLInputElement,
      settingsShowVotesDescription: document.getElementById('settings-show-votes-description'),
      voteOptionsDisplay: document.getElementById('vote-options-display'),
      newVoteOptionInput: document.getElementById('new-vote-option') as HTMLInputElement,
      addOptionBtn: document.getElementById('add-option-btn'),
      roomNameDisplay: document.getElementById('room-name-display'),
      voteCardsContainer: document.getElementById('vote-cards'),

      // Avatar modal
      changeAvatarBtn: document.getElementById('change-avatar-btn'),
      currentUserAvatar: document.getElementById('current-user-avatar') as HTMLImageElement,
      avatarModal: document.getElementById('avatar-modal'),
      avatarPreview: document.getElementById('avatar-preview') as HTMLImageElement,
      cancelAvatarBtn: document.getElementById('cancel-avatar-btn'),
      saveAvatarBtn: document.getElementById('save-avatar-btn'),
    };
  }

  init(): void {
    this.bindEvents();
    this.bindPromoteButtons();
    this.bloc.subscribe(this.handleBlocEvent.bind(this));
    this.bloc.startRealtimeSubscription();

    // Apply initial showVotes setting (manager always sees, others based on setting)
    this.toggleVoteIndicatorsVisibility(this.bloc.isManager || this.bloc.showVotes);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.bloc.dispose();
    });
  }

  // Loading state helpers
  private setLoading(button: HTMLElement | null, loading: boolean): void {
    if (!button) return;

    if (loading) {
      // Save current state
      this.buttonStates.set(button, {
        html: button.innerHTML,
        disabled: button.hasAttribute('disabled'),
      });
      // Set loading state
      button.innerHTML = SPINNER_SVG;
      button.setAttribute('disabled', 'true');
      button.classList.add('opacity-75', 'cursor-wait');
    } else {
      // Restore previous state
      const state = this.buttonStates.get(button);
      if (state) {
        button.innerHTML = state.html;
        if (!state.disabled) {
          button.removeAttribute('disabled');
        }
        this.buttonStates.delete(button);
      }
      button.classList.remove('opacity-75', 'cursor-wait');
    }
  }

  private async withLoading<T>(button: HTMLElement | null, action: () => Promise<T>): Promise<T> {
    this.setLoading(button, true);
    try {
      return await action();
    } finally {
      this.setLoading(button, false);
    }
  }

  private bindPromoteButtons(): void {
    // Bind click handlers to server-rendered promote buttons
    document.querySelectorAll('.promote-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const participantId = (btn as HTMLElement).dataset.participantId;
        if (participantId) {
          this.handlePromoteClick(participantId);
        }
      });
    });

    // Bind click handlers to server-rendered demote buttons
    document.querySelectorAll('.demote-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const participantId = (btn as HTMLElement).dataset.participantId;
        if (participantId) {
          this.handleDemoteClick(participantId);
        }
      });
    });

    // Bind click handlers to server-rendered kick buttons
    document.querySelectorAll('.kick-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const participantId = (btn as HTMLElement).dataset.participantId;
        if (participantId) {
          this.handleKickClick(participantId);
        }
      });
    });
  }

  private bindEvents(): void {
    // Vote card clicks
    this.elements.voteCards.forEach((card) => {
      card.addEventListener('click', () => this.handleVoteClick(card));
    });

    // Manager controls
    this.elements.startVotingBtn?.addEventListener('click', () => this.handleStartVoting());
    this.elements.revealVotesBtn?.addEventListener('click', () => this.handleRevealVotes());
    this.elements.resetVotesBtn?.addEventListener('click', () => this.handleResetVotes());
    this.elements.newRoundBtn?.addEventListener('click', () => this.handleNewRound());
    this.elements.showVotesToggle?.addEventListener('change', () => this.handleToggleShowVotes());

    // Edit name
    this.elements.editNameBtn?.addEventListener('click', () => this.showEditNameForm());
    this.elements.cancelEditBtn?.addEventListener('click', () => this.hideEditNameForm());
    this.elements.editNameForm?.addEventListener('submit', (e) => this.handleEditNameSubmit(e));

    // Leave room
    this.elements.leaveRoomBtn?.addEventListener('click', () => this.openLeaveModal());
    this.elements.cancelLeaveBtn?.addEventListener('click', () => this.closeLeaveModal());
    this.elements.confirmLeaveBtn?.addEventListener('click', () => this.handleLeaveRoom());
    // Note: Backdrop click and escape key are handled by the Modal component

    // Kick participant
    this.elements.cancelKickBtn?.addEventListener('click', () => this.closeKickModal());
    this.elements.confirmKickBtn?.addEventListener('click', () => this.handleConfirmKick());

    // Join form
    this.elements.joinForm?.addEventListener('submit', (e) => this.handleJoinSubmit(e));

    // Settings modal
    this.elements.openSettingsBtn?.addEventListener('click', () => this.openSettingsModal());
    this.elements.cancelSettingsBtn?.addEventListener('click', () => this.closeSettingsModal());
    this.elements.saveSettingsBtn?.addEventListener('click', () => this.handleSaveSettings());
    // Note: Close button, backdrop click and escape key are handled by the Modal component

    // Settings - show votes toggle in modal
    this.elements.settingsShowVotes?.addEventListener('change', () => {
      const checked = this.elements.settingsShowVotes?.checked ?? false;
      if (this.elements.settingsShowVotesDescription) {
        this.elements.settingsShowVotesDescription.textContent = checked
          ? 'Vote indicators visible in sidebar'
          : 'Vote indicators hidden in sidebar';
      }
    });

    // Settings - vote options
    this.elements.addOptionBtn?.addEventListener('click', () => this.handleAddVoteOption());
    this.elements.newVoteOptionInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleAddVoteOption();
      }
    });

    // Settings - preset buttons
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = (btn as HTMLElement).dataset.preset;
        if (preset) {
          try {
            const values = JSON.parse(preset) as string[];
            this.renderVoteOptions(values);
          } catch (e) {
            console.error('Failed to parse preset:', e);
          }
        }
      });
    });

    // Settings - remove option buttons (delegate)
    this.elements.voteOptionsDisplay?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const removeBtn = target.closest('.remove-option-btn');
      if (removeBtn) {
        const tag = removeBtn.closest('.vote-option-tag');
        tag?.remove();
      }
    });

    // Copy functionality
    this.elements.copyBtn?.addEventListener('click', () => this.handleCopyLink());

    // Avatar modal
    this.elements.changeAvatarBtn?.addEventListener('click', () => this.openAvatarModal());
    this.elements.cancelAvatarBtn?.addEventListener('click', () => this.closeAvatarModal());
    this.elements.saveAvatarBtn?.addEventListener('click', () => this.handleSaveAvatar());
  }

  private handleBlocEvent(event: RoomEvent): void {
    switch (event.type) {
      case 'voting_status_changed':
        this.updateVotingStatusUI(event.payload as VotingStatus);
        break;
      case 'topic_changed':
        this.updateTopicUI(event.payload as string);
        break;
      case 'participant_joined':
        this.addParticipantToList(event.payload as Participant);
        break;
      case 'participant_left':
        this.removeParticipantFromList((event.payload as { id: string }).id);
        break;
      case 'participant_updated':
        this.updateParticipantInList(event.payload as Participant);
        break;
      case 'vote_submitted':
        this.updateVoteCardSelection(event.payload as string);
        this.updateOwnVoteIndicator(event.payload as string);
        break;
      case 'show_votes_changed':
        this.updateShowVotesUI(event.payload as boolean);
        break;
      case 'vote_options_changed':
        this.updateVoteCardsUI(event.payload as string[]);
        break;
      case 'room_name_changed':
        this.updateRoomNameUI(event.payload as string);
        break;
      case 'role_changed':
        this.handleRoleChange(event.payload as { isManager: boolean });
        break;
      case 'kicked':
        this.handleKicked();
        break;
      case 'presence_changed':
        this.updatePresenceUI(event.payload as string[]);
        break;
      case 'error':
        this.showError(event.payload as string);
        break;
    }
  }

  private handleKicked(): void {
    alert('You have been removed from this room by a manager.');
    window.location.reload();
  }

  private updatePresenceUI(onlineIds: string[]): void {
    const onlineSet = new Set(onlineIds);

    this.elements.participantsList?.querySelectorAll('li').forEach((li) => {
      const participantId = li.getAttribute('data-participant-id');
      if (!participantId) return;

      const isOnline = onlineSet.has(participantId);
      const wasOnline = li.getAttribute('data-is-online') === 'true';

      if (isOnline === wasOnline) return; // No change

      li.setAttribute('data-is-online', isOnline ? 'true' : 'false');

      // Update opacity
      if (isOnline) {
        li.classList.remove('opacity-50');
      } else {
        li.classList.add('opacity-50');
      }

      // Update avatar styling (now an image)
      const avatarImg = li.querySelector('.participant-avatar') as HTMLImageElement;
      if (avatarImg) {
        if (isOnline) {
          avatarImg.classList.remove('grayscale', 'opacity-70');
        } else {
          avatarImg.classList.add('grayscale', 'opacity-70');
        }
      }

      // Update online indicator
      const indicator = li.querySelector('.online-indicator') as HTMLElement;
      if (indicator) {
        indicator.setAttribute('data-is-online', isOnline ? 'true' : 'false');
        if (isOnline) {
          indicator.classList.remove('bg-slate-700');
          indicator.classList.add('bg-green-500');
          indicator.innerHTML = '<span></span>';
        } else {
          indicator.classList.remove('bg-green-500');
          indicator.classList.add('bg-slate-700');
          indicator.innerHTML = `
            <svg class="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4" />
            </svg>
          `;
        }
      }
    });
  }

  // UI Update methods
  private updateVotingStatusUI(status: VotingStatus): void {
    // Update status banner
    const statusConfig: Record<VotingStatus, { bg: string; dot: string; text: string; label: string; pulse: boolean }> = {
      waiting: {
        bg: 'bg-slate-800',
        dot: 'bg-slate-500',
        text: 'text-slate-400',
        label: 'Waiting for manager to start voting',
        pulse: false,
      },
      voting: {
        bg: 'bg-indigo-900/50',
        dot: 'bg-indigo-500',
        text: 'text-indigo-300',
        label: 'Voting in progress',
        pulse: true,
      },
      revealed: {
        bg: 'bg-green-900/50',
        dot: 'bg-green-500',
        text: 'text-green-300',
        label: 'Votes revealed',
        pulse: false,
      },
    };

    const config = statusConfig[status];
    if (this.elements.statusBanner) {
      this.elements.statusBanner.setAttribute('data-status', status);
      const inner = this.elements.statusBanner.querySelector('div');

      if (inner) {
        // Remove old bg classes and add new one
        inner.className = `inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bg}`;
        // Update the dot (first span inside inner)
        const dot = inner.querySelector('span:first-child');
        if (dot) {
          dot.className = `w-2 h-2 rounded-full ${config.dot}${config.pulse ? ' animate-pulse' : ''}`;
        }
      }
    }
    if (this.elements.statusText) {
      this.elements.statusText.textContent = config.label;
      this.elements.statusText.className = `text-sm ${config.text}`;
    }

    // Update manager controls
    this.elements.managerWaiting?.classList.toggle('hidden', status !== 'waiting');
    this.elements.managerVoting?.classList.toggle('hidden', status !== 'voting');
    this.elements.managerRevealed?.classList.toggle('hidden', status !== 'revealed');

    // Update vote cards interactivity
    this.elements.voteCardsSection?.classList.toggle('opacity-50', status !== 'voting');
    this.elements.voteCardsSection?.classList.toggle('pointer-events-none', status !== 'voting');

    // Update disabled attribute on vote cards
    this.elements.voteCards.forEach((card) => {
      if (status === 'voting') {
        card.removeAttribute('disabled');
      } else {
        card.setAttribute('disabled', 'true');
      }
    });

    // Update results section
    this.elements.resultsSection?.classList.toggle('hidden', status !== 'revealed');

    // Handle state transitions
    if (status === 'voting') {
      this.clearVoteCardSelection();
      this.clearVoteIndicators();
      if (this.elements.yourVoteDisplay) this.elements.yourVoteDisplay.textContent = '-';
    }

    if (status === 'revealed') {
      this.revealAllVotes();
      this.calculateAndShowResults();
    }
  }

  private clearVoteIndicators(): void {
    this.elements.participantsList?.querySelectorAll('.vote-indicator').forEach((indicator) => {
      const el = indicator as HTMLElement;
      el.dataset.hasVote = 'false';
      el.dataset.vote = '';
      el.className = 'vote-indicator w-7 h-7 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 bg-slate-700/50 text-slate-500';
      el.innerHTML = '<span>-</span>';
    });
  }

  private revealAllVotes(): void {
    this.elements.participantsList?.querySelectorAll('.vote-indicator').forEach((indicator) => {
      const el = indicator as HTMLElement;
      const vote = el.dataset.vote;
      if (vote) {
        el.className = 'vote-indicator w-7 h-7 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 bg-indigo-600/30 text-indigo-300';
        el.innerHTML = `<span class="vote-value">${vote}</span>`;
      }
    });
  }

  private updateTopicUI(topic: string): void {
    if (this.elements.currentTopicDisplay) {
      this.elements.currentTopicDisplay.textContent = topic || 'No topic set';
    }
    this.elements.topicLabel?.classList.toggle('hidden', !topic);
  }

  private updateVoteCardSelection(vote: string): void {
    this.elements.voteCards.forEach((card) => {
      const isSelected = card.dataset.vote === vote;
      card.classList.toggle('border-indigo-500', isSelected);
      card.classList.toggle('bg-indigo-600/20', isSelected);
      card.classList.toggle('selected', isSelected);
      card.classList.toggle('border-slate-600', !isSelected);
    });

    if (this.elements.yourVoteDisplay) {
      this.elements.yourVoteDisplay.textContent = vote;
    }
  }

  private clearVoteCardSelection(): void {
    this.elements.voteCards.forEach((card) => {
      card.classList.remove('border-indigo-500', 'bg-indigo-600/20', 'selected');
      card.classList.add('border-slate-600');
    });
  }


  private addParticipantToList(participant: Participant): void {
    if (this.elements.participantsList?.querySelector(`[data-participant-id="${participant.id}"]`)) {
      return; // Already exists
    }

    const li = this.createParticipantElement(participant, true);
    this.elements.participantsList?.appendChild(li);
    this.updateParticipantCount();
  }

  private removeParticipantFromList(participantId: string): void {
    const el = this.elements.participantsList?.querySelector(`[data-participant-id="${participantId}"]`);
    el?.remove();
    this.updateParticipantCount();
  }

  private updateParticipantInList(participant: Participant): void {
    const el = this.elements.participantsList?.querySelector(`[data-participant-id="${participant.id}"]`);
    if (!el) return;

    // Update name
    const nameEl = el.querySelector('.participant-name');
    if (nameEl) nameEl.textContent = participant.name;

    // Update avatar
    const avatarEl = el.querySelector('.participant-avatar') as HTMLImageElement;
    if (avatarEl) {
      const avatarStyle = participant.avatar_style || 'adventurer';
      const avatarSeed = participant.avatar_seed || participant.name;
      avatarEl.src = getAvatarUrl(avatarStyle, avatarSeed, 32);
      avatarEl.dataset.avatarStyle = avatarStyle;
      avatarEl.dataset.avatarSeed = avatarSeed;
    }

    // Update role badge and buttons
    const currentRole = el.getAttribute('data-participant-role');
    if (currentRole !== participant.role) {
      el.setAttribute('data-participant-role', participant.role);
      const roleContainer = el.querySelector('.flex-1');
      const existingBadge = roleContainer?.querySelector('.text-indigo-400');

      if (participant.role === 'manager' && !existingBadge) {
        const badge = document.createElement('span');
        badge.className = 'text-xs text-indigo-400';
        badge.textContent = 'Manager';
        roleContainer?.appendChild(badge);
      } else if (participant.role !== 'manager' && existingBadge) {
        existingBadge.remove();
      }

      // Refresh buttons for this participant
      this.refreshParticipantButtonsForElement(el as HTMLElement, participant);
    }

    // Update vote indicator
    this.updateVoteIndicator(el, participant.current_vote);

    // Update your vote display if it's you
    if (participant.id === this.bloc.currentParticipantId && this.elements.yourVoteDisplay) {
      this.elements.yourVoteDisplay.textContent = participant.current_vote || '-';
    }
  }

  private updateVoteIndicator(participantEl: Element, vote: string | null): void {
    const indicator = participantEl.querySelector('.vote-indicator') as HTMLElement;
    if (!indicator) return;

    const hasVoted = !!vote;
    const showVoteValue = (this.bloc.isManager || this.bloc.votingStatus === 'revealed') && vote;

    indicator.dataset.hasVote = hasVoted ? 'true' : 'false';
    indicator.dataset.vote = vote || '';

    // Update classes
    indicator.className = 'vote-indicator w-7 h-7 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ' +
      (showVoteValue
        ? 'bg-indigo-600/30 text-indigo-300'
        : hasVoted
          ? 'bg-green-600/30 text-green-400'
          : 'bg-slate-700/50 text-slate-500');

    // Update content
    if (showVoteValue) {
      indicator.innerHTML = `<span class="vote-value">${vote}</span>`;
    } else if (hasVoted) {
      indicator.innerHTML = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>';
    } else {
      indicator.innerHTML = '<span>-</span>';
    }
  }

  private updateOwnVoteIndicator(vote: string): void {
    const currentParticipantId = this.bloc.currentParticipantId;
    if (!currentParticipantId) return;

    const el = this.elements.participantsList?.querySelector(`[data-participant-id="${currentParticipantId}"]`);
    if (!el) return;

    this.updateVoteIndicator(el, vote);
  }


  private createParticipantElement(participant: Participant, animate = false): HTMLElement {
    const li = document.createElement('li');
    // New participants are assumed online since they just joined
    const isOnline = this.bloc.onlineUserIds.has(participant.id);
    li.className = `flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50${animate ? ' participant-enter' : ''}${!isOnline ? ' opacity-50' : ''}`;
    li.dataset.participantId = participant.id;
    li.dataset.participantRole = participant.role;
    li.setAttribute('data-is-online', isOnline ? 'true' : 'false');

    const isCurrentUser = participant.id === this.bloc.currentParticipantId;
    const canPromote = this.bloc.isManager && !isCurrentUser && participant.role !== 'manager';
    const canDemote = this.bloc.isManager && participant.role === 'manager';
    const canKick = this.bloc.isManager && !isCurrentUser;

    // Avatar URL
    const avatarStyle = participant.avatar_style || 'adventurer';
    const avatarSeed = participant.avatar_seed || participant.name;
    const avatarUrl = getAvatarUrl(avatarStyle, avatarSeed, 32);

    // Vote indicator logic - managers see actual votes, others see checkmark
    const hasVoted = !!participant.current_vote;
    const showVoteValue = (this.bloc.isManager || this.bloc.votingStatus === 'revealed') && participant.current_vote;
    const shouldHideVoteIndicator = !this.bloc.isManager && !this.bloc.showVotes;
    const voteIndicatorClass = showVoteValue
      ? 'bg-indigo-600/30 text-indigo-300'
      : hasVoted
        ? 'bg-green-600/30 text-green-400'
        : 'bg-slate-700/50 text-slate-500';
    const voteIndicatorContent = showVoteValue
      ? `<span class="vote-value">${participant.current_vote}</span>`
      : hasVoted
        ? '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>'
        : '<span>-</span>';

    li.innerHTML = `
      <div class="relative flex-shrink-0">
        <img
          src="${avatarUrl}"
          alt="${participant.name}"
          class="w-8 h-8 rounded-full participant-avatar${!isOnline ? ' grayscale opacity-70' : ''}"
          data-avatar-style="${avatarStyle}"
          data-avatar-seed="${avatarSeed}"
          loading="lazy"
        />
        ${isCurrentUser ? `
          <div class="absolute -top-1 -left-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-slate-900 flex items-center justify-center current-user-indicator">
            <svg class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        ` : ''}
        <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center online-indicator ${isOnline ? 'bg-green-500' : 'bg-slate-700'}" data-is-online="${isOnline}">
          ${isOnline ? '<span></span>' : `
            <svg class="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4" />
            </svg>
          `}
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <span class="text-white text-sm truncate block participant-name">${participant.name}</span>
        ${participant.role === 'manager' ? '<span class="text-xs text-indigo-400">Manager</span>' : ''}
      </div>
      <div class="vote-indicator w-7 h-7 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${voteIndicatorClass}${shouldHideVoteIndicator ? ' hidden' : ''}" data-has-vote="${hasVoted}" data-vote="${participant.current_vote || ''}">
        ${voteIndicatorContent}
      </div>
      <div class="w-6 flex items-center justify-center flex-shrink-0 promote-demote-slot">
        ${canPromote ? `
          <button class="promote-btn p-1 text-slate-400 hover:text-indigo-400 transition-colors" title="Make manager" data-participant-id="${participant.id}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </button>
        ` : ''}
        ${canDemote ? `
          <button class="demote-btn p-1 text-slate-400 hover:text-red-400 transition-colors" title="${isCurrentUser ? 'Step down as manager' : 'Remove manager'}" data-participant-id="${participant.id}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ` : ''}
      </div>
      <div class="w-6 flex items-center justify-center flex-shrink-0 kick-slot">
        ${canKick ? `
          <button class="kick-btn p-1 text-slate-400 hover:text-red-400 transition-colors" title="Remove from room" data-participant-id="${participant.id}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ` : ''}
      </div>
    `;

    // Add click handlers
    if (canPromote) {
      const promoteBtn = li.querySelector('.promote-btn');
      promoteBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handlePromoteClick(participant.id);
      });
    }

    if (canDemote) {
      const demoteBtn = li.querySelector('.demote-btn');
      demoteBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleDemoteClick(participant.id);
      });
    }

    if (canKick) {
      const kickBtn = li.querySelector('.kick-btn');
      kickBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleKickClick(participant.id);
      });
    }

    return li;
  }

  private async handlePromoteClick(participantId: string): Promise<void> {
    const button = document.querySelector(`.promote-btn[data-participant-id="${participantId}"]`) as HTMLElement;
    await this.withLoading(button, () => this.bloc.promoteToManager(participantId));
  }

  private updateParticipantCount(): void {
    const count = this.elements.participantsList?.querySelectorAll('li').length || 0;
    if (this.elements.participantCount) {
      this.elements.participantCount.textContent = String(count);
    }
    this.elements.noParticipants?.classList.toggle('hidden', count > 0);
  }

  // Color palette for vote groups - high contrast, easily distinguishable
  private static readonly VOTE_COLORS = [
    '#6366f1', // indigo-500
    '#22c55e', // green-500
    '#f97316', // orange-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#eab308', // yellow-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#14b8a6', // teal-500
    '#f43f5e', // rose-500
  ];

  private calculateAndShowResults(): void {
    // Collect participants with their votes and names
    const participantVotes: { name: string; vote: string | null }[] = [];

    this.elements.participantsList?.querySelectorAll('li').forEach((li) => {
      const indicator = li.querySelector('.vote-indicator') as HTMLElement;
      const nameEl = li.querySelector('.participant-name');
      const voteValue = indicator?.dataset.vote || null;
      const name = nameEl?.textContent || 'Unknown';
      participantVotes.push({ name, vote: voteValue });
    });

    // Group by vote value
    const voteGroups: Record<string, string[]> = {};
    const numericVotes: number[] = [];

    participantVotes.forEach(({ name, vote }) => {
      if (vote) {
        if (!voteGroups[vote]) {
          voteGroups[vote] = [];
        }
        voteGroups[vote].push(name);
        const num = parseFloat(vote);
        if (!isNaN(num)) {
          numericVotes.push(num);
        }
      }
    });

    // Sort vote groups by count (descending), then by vote value
    const sortedVotes = Object.entries(voteGroups).sort((a, b) => {
      if (b[1].length !== a[1].length) {
        return b[1].length - a[1].length;
      }
      // Secondary sort by numeric value if possible
      const numA = parseFloat(a[0]);
      const numB = parseFloat(b[0]);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a[0].localeCompare(b[0]);
    });

    const totalVoters = participantVotes.filter(p => p.vote).length;

    // Render list of participants and their votes (voters first, then non-voters)
    if (this.elements.voteResults) {
      const sortedParticipants = [...participantVotes].sort((a, b) => {
        // Voters come first
        if (a.vote && !b.vote) return -1;
        if (!a.vote && b.vote) return 1;
        return 0;
      });

      this.elements.voteResults.innerHTML = sortedParticipants
        .map(({ name, vote }) => `
          <div class="flex items-center justify-between py-2 px-3 bg-slate-900/50 rounded-lg">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 bg-indigo-600/80 rounded-full flex items-center justify-center text-white text-sm font-medium">${name.charAt(0).toUpperCase()}</span>
              <span class="text-white">${name}</span>
            </div>
            ${vote
              ? `<span class="text-lg font-bold text-indigo-400">${vote}</span>`
              : `<span class="text-sm text-slate-500 italic">Didn't vote</span>`
            }
          </div>
        `).join('');
    }

    // Calculate and display average
    const average = numericVotes.length > 0
      ? numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length
      : null;

    if (this.elements.voteAverage) {
      this.elements.voteAverage.textContent = average !== null ? average.toFixed(1) : '-';
    }

    // Render pie chart
    this.renderPieChart(sortedVotes, totalVoters);
  }

  private renderPieChart(sortedVotes: [string, string[]][], totalVoters: number): void {
    if (!this.elements.pieChart || !this.elements.pieLegend) return;

    // Clear existing content
    this.elements.pieChart.innerHTML = '';
    this.elements.pieLegend.innerHTML = '';

    if (totalVoters === 0) {
      // Show empty state
      this.elements.pieChart.innerHTML = `
        <circle cx="50" cy="50" r="45" fill="#334155" />
        <text x="50" y="55" text-anchor="middle" fill="#94a3b8" font-size="8">No votes</text>
      `;
      return;
    }

    const cx = 50;
    const cy = 50;
    const radius = 45;
    let currentAngle = -90; // Start from top

    // Create pie slices
    sortedVotes.forEach(([vote, names], index) => {
      const percentage = names.length / totalVoters;
      const angle = percentage * 360;
      const color = RoomController.VOTE_COLORS[index % RoomController.VOTE_COLORS.length];

      if (percentage === 1) {
        // Full circle - just draw a circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', String(cx));
        circle.setAttribute('cy', String(cy));
        circle.setAttribute('r', String(radius));
        circle.setAttribute('fill', color);
        this.elements.pieChart!.appendChild(circle);
      } else {
        // Create arc path
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);

        const largeArcFlag = angle > 180 ? 1 : 0;

        const pathData = [
          `M ${cx} ${cy}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', color);
        this.elements.pieChart!.appendChild(path);

        currentAngle = endAngle;
      }

      // Create legend item
      const legendItem = document.createElement('div');
      legendItem.className = 'flex items-center gap-2 px-2 py-1 bg-slate-900/50 rounded';
      legendItem.innerHTML = `
        <span class="w-3 h-3 rounded-sm flex-shrink-0" style="background-color: ${color}"></span>
        <span class="text-white font-medium">${vote}</span>
        <span class="text-slate-400 text-sm">${Math.round(percentage * 100)}%</span>
      `;
      this.elements.pieLegend!.appendChild(legendItem);
    });
  }

  // Event handlers
  private async handleVoteClick(card: HTMLElement): Promise<void> {
    const vote = card.dataset.vote;
    if (!vote) return;

    await this.bloc.submitVote(vote);
  }

  private async handleStartVoting(): Promise<void> {
    const topic = this.elements.topicInput?.value || '';
    await this.withLoading(this.elements.startVotingBtn, () => this.bloc.startVoting(topic));
  }

  private async handleRevealVotes(): Promise<void> {
    await this.withLoading(this.elements.revealVotesBtn, () => this.bloc.revealVotes());
  }

  private async handleResetVotes(): Promise<void> {
    await this.withLoading(this.elements.resetVotesBtn, () => this.bloc.resetVotes());
  }

  private async handleNewRound(): Promise<void> {
    const topic = this.elements.nextTopicInput?.value || '';
    const success = await this.withLoading(this.elements.newRoundBtn, () => this.bloc.startVoting(topic));
    if (success && this.elements.nextTopicInput) {
      this.elements.nextTopicInput.value = '';
    }
  }

  private async handleToggleShowVotes(): Promise<void> {
    await this.bloc.toggleShowVotes();
  }

  private updateShowVotesUI(showVotes: boolean): void {
    // Update toggle state
    if (this.elements.showVotesToggle) {
      this.elements.showVotesToggle.checked = showVotes;
    }

    // Update description text
    if (this.elements.showVotesDescription) {
      this.elements.showVotesDescription.textContent = showVotes
        ? 'Vote indicators visible in sidebar'
        : 'Vote indicators hidden in sidebar';
    }

    // Toggle visibility of vote indicator boxes in sidebar
    // Manager always sees votes, others only if showVotes is enabled
    this.toggleVoteIndicatorsVisibility(this.bloc.isManager || showVotes);
  }

  private toggleVoteIndicatorsVisibility(visible: boolean): void {
    this.elements.participantsList?.querySelectorAll('.vote-indicator').forEach((indicator) => {
      if (visible) {
        (indicator as HTMLElement).classList.remove('hidden');
      } else {
        (indicator as HTMLElement).classList.add('hidden');
      }
    });
  }

  private showEditNameForm(): void {
    this.elements.editNameForm?.classList.remove('hidden');
    this.elements.editNameInput?.focus();
    this.elements.editNameInput?.select();
  }

  private hideEditNameForm(): void {
    this.elements.editNameForm?.classList.add('hidden');
    this.elements.editError?.classList.add('hidden');
    if (this.elements.editNameInput && this.elements.currentUserName) {
      this.elements.editNameInput.value = this.elements.currentUserName.textContent || '';
    }
  }

  private async handleEditNameSubmit(e: Event): Promise<void> {
    e.preventDefault();
    const name = this.elements.editNameInput?.value;
    if (!name) return;

    const submitBtn = this.elements.editNameForm?.querySelector('button[type="submit"]') as HTMLElement;
    const success = await this.withLoading(submitBtn, () => this.bloc.updateName(name));

    if (success) {
      if (this.elements.currentUserName) this.elements.currentUserName.textContent = name;
      this.hideEditNameForm();
    }
  }

  private openLeaveModal(): void {
    // Use the Modal component's open function
    (window as unknown as Record<string, () => void>)['open_leave-modal']?.();
  }

  private closeLeaveModal(): void {
    // Use the Modal component's close function with animation
    (window as unknown as Record<string, () => void>)['close_leave-modal']?.();
  }

  private async handleLeaveRoom(): Promise<void> {
    const success = await this.withLoading(this.elements.confirmLeaveBtn, () => this.bloc.leaveRoom());
    if (success) {
      window.location.reload();
    } else {
      this.closeLeaveModal();
    }
  }

  private async handleJoinSubmit(e: Event): Promise<void> {
    e.preventDefault();
    const formData = new FormData(this.elements.joinForm!);

    try {
      const response = await fetch(this.elements.joinForm!.action, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        this.showJoinError(result.error || 'Failed to join room');
        return;
      }

      window.location.reload();
    } catch {
      this.showJoinError('Failed to join room. Please try again.');
    }
  }

  private async handleCopyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.elements.roomUrlInput!.value);
      this.elements.copyIcon?.classList.add('hidden');
      this.elements.checkIcon?.classList.remove('hidden');
      setTimeout(() => {
        this.elements.copyIcon?.classList.remove('hidden');
        this.elements.checkIcon?.classList.add('hidden');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  private showJoinError(message: string): void {
    if (this.elements.joinError) {
      this.elements.joinError.textContent = message;
      this.elements.joinError.classList.remove('hidden');
    }
  }

  private showError(message: string): void {
    console.error('Room error:', message);
    // Could show a toast notification here
    alert(`Error: ${message}`);
  }

  // Settings modal methods
  private openSettingsModal(): void {
    // Reset form to current values
    if (this.elements.settingsRoomName) {
      this.elements.settingsRoomName.value = this.bloc.roomName;
    }
    if (this.elements.settingsShowVotes) {
      this.elements.settingsShowVotes.checked = this.bloc.showVotes;
    }
    if (this.elements.settingsShowVotesDescription) {
      this.elements.settingsShowVotesDescription.textContent = this.bloc.showVotes
        ? 'Vote indicators visible in sidebar'
        : 'Vote indicators hidden in sidebar';
    }
    this.renderVoteOptions(this.bloc.voteOptions);
    // Use the Modal component's open function
    (window as unknown as Record<string, () => void>)['open_settings-modal']?.();
  }

  private closeSettingsModal(): void {
    // Use the Modal component's close function with animation
    (window as unknown as Record<string, () => void>)['close_settings-modal']?.();
  }

  private renderVoteOptions(options: string[]): void {
    if (!this.elements.voteOptionsDisplay) return;

    const isManager = this.bloc.isManager;
    this.elements.voteOptionsDisplay.innerHTML = options.map((option) => `
      <span
        class="vote-option-tag inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-white text-sm rounded"
        data-value="${option}"
      >
        ${option}
        ${isManager ? `
          <button type="button" class="remove-option-btn text-slate-400 hover:text-red-400 transition-colors">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ` : ''}
      </span>
    `).join('');
  }

  private getCurrentVoteOptions(): string[] {
    const options: string[] = [];
    this.elements.voteOptionsDisplay?.querySelectorAll('.vote-option-tag').forEach((tag) => {
      const value = (tag as HTMLElement).dataset.value;
      if (value) options.push(value);
    });
    return options;
  }

  private handleAddVoteOption(): void {
    if (!this.bloc.isManager) return;

    const input = this.elements.newVoteOptionInput;
    if (!input) return;

    const value = input.value.trim();
    if (!value || value.length > 5) return;

    const currentOptions = this.getCurrentVoteOptions();
    if (currentOptions.includes(value)) {
      input.value = '';
      return;
    }

    currentOptions.push(value);
    this.renderVoteOptions(currentOptions);
    input.value = '';
  }

  private async handleSaveSettings(): Promise<void> {
    if (!this.bloc.isManager) return;

    const name = this.elements.settingsRoomName?.value?.trim();
    const showVotes = this.elements.settingsShowVotes?.checked ?? false;
    const voteOptions = this.getCurrentVoteOptions();

    if (!name) {
      alert('Room name cannot be empty');
      return;
    }

    if (voteOptions.length < 2) {
      alert('At least 2 vote options are required');
      return;
    }

    const success = await this.withLoading(this.elements.saveSettingsBtn, () =>
      this.bloc.updateSettings({
        name,
        showVotes,
        voteOptions,
      })
    );

    if (success) {
      this.closeSettingsModal();
    }
  }

  private updateVoteCardsUI(voteOptions: string[]): void {
    if (!this.elements.voteCardsContainer) return;

    const currentVote = this.bloc.currentVote;
    const isDisabled = this.bloc.votingStatus !== 'voting';

    // Determine grid columns
    const gridCols = voteOptions.length <= 5 ? 'grid-cols-5' : voteOptions.length <= 7 ? 'grid-cols-7' : 'grid-cols-5 sm:grid-cols-10';
    this.elements.voteCardsContainer.className = `grid ${gridCols} gap-2 mb-8`;

    this.elements.voteCardsContainer.innerHTML = voteOptions.map((value) => `
      <button
        class="vote-card aspect-[3/4] bg-slate-800 hover:bg-slate-700 border-2 rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold text-white transition-all ${currentVote === value ? 'border-indigo-500 bg-indigo-600/20 selected' : 'border-slate-600 hover:border-indigo-500'}"
        data-vote="${value}"
        ${isDisabled ? 'disabled' : ''}
      >
        ${value}
      </button>
    `).join('');

    // Re-bind click events
    this.elements.voteCards = document.querySelectorAll('.vote-card') as NodeListOf<HTMLElement>;
    this.elements.voteCards.forEach((card) => {
      card.addEventListener('click', () => this.handleVoteClick(card));
    });
  }

  private updateRoomNameUI(name: string): void {
    if (this.elements.roomNameDisplay) {
      this.elements.roomNameDisplay.textContent = name;
    }
    // Also update document title
    document.title = `${name} - ${this.bloc.appName}`;
  }

  private handleRoleChange(payload: { isManager: boolean }): void {
    if (payload.isManager) {
      // Show manager controls
      const managerControls = document.getElementById('manager-controls');
      if (managerControls) {
        managerControls.classList.remove('hidden');
      }

      // Show settings button
      this.elements.openSettingsBtn?.classList.remove('hidden');

      // Update manager badge in "You" section
      const youSection = document.querySelector('.border-b.border-slate-800');
      if (youSection && !youSection.querySelector('.bg-indigo-600\\/30')) {
        const badgeContainer = youSection.querySelector('.flex.items-center.gap-2');
        if (badgeContainer) {
          const badge = document.createElement('span');
          badge.className = 'text-xs bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded-full';
          badge.textContent = 'Manager';
          badgeContainer.appendChild(badge);
        }
      }

      // Add promote/demote buttons to participants
      this.refreshParticipantButtons();

      // Update the correct manager control state based on current voting status
      this.updateVotingStatusUI(this.bloc.votingStatus);
    } else {
      // Hide manager controls
      const managerControls = document.getElementById('manager-controls');
      if (managerControls) {
        managerControls.classList.add('hidden');
      }

      // Hide settings button
      this.elements.openSettingsBtn?.classList.add('hidden');

      // Remove manager badge from "You" section
      const youSection = document.querySelector('.border-b.border-slate-800');
      youSection?.querySelector('.bg-indigo-600\\/30')?.remove();

      // Remove all promote/demote/kick buttons
      document.querySelectorAll('.promote-btn, .demote-btn, .kick-btn').forEach(btn => btn.remove());
    }
  }

  private refreshParticipantButtons(): void {
    this.elements.participantsList?.querySelectorAll('li').forEach((li) => {
      const participantId = li.getAttribute('data-participant-id');
      const role = li.getAttribute('data-participant-role');
      this.updateButtonsForParticipant(li as HTMLElement, participantId, role);
    });
  }

  private refreshParticipantButtonsForElement(el: HTMLElement, participant: Participant): void {
    this.updateButtonsForParticipant(el, participant.id, participant.role);
  }

  private updateButtonsForParticipant(li: HTMLElement, participantId: string | null, role: string | null): void {
    const isCurrentUser = participantId === this.bloc.currentParticipantId;
    const promoteDemoteSlot = li.querySelector('.promote-demote-slot');
    const kickSlot = li.querySelector('.kick-slot');

    // Remove existing buttons first
    li.querySelector('.promote-btn')?.remove();
    li.querySelector('.demote-btn')?.remove();
    li.querySelector('.kick-btn')?.remove();

    if (!this.bloc.isManager) return;

    if (role === 'manager') {
      // Add demote button for managers
      const demoteBtn = document.createElement('button');
      demoteBtn.className = 'demote-btn p-1 text-slate-400 hover:text-red-400 transition-colors';
      demoteBtn.title = isCurrentUser ? 'Step down as manager' : 'Remove manager';
      demoteBtn.dataset.participantId = participantId || '';
      demoteBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      `;
      demoteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (participantId) this.handleDemoteClick(participantId);
      });
      promoteDemoteSlot?.appendChild(demoteBtn);
    } else {
      // Add promote button for non-managers (except self)
      if (!isCurrentUser) {
        const promoteBtn = document.createElement('button');
        promoteBtn.className = 'promote-btn p-1 text-slate-400 hover:text-indigo-400 transition-colors';
        promoteBtn.title = 'Make manager';
        promoteBtn.dataset.participantId = participantId || '';
        promoteBtn.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        `;
        promoteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (participantId) this.handlePromoteClick(participantId);
        });
        promoteDemoteSlot?.appendChild(promoteBtn);
      }
    }

    // Add kick button for all other participants (not self)
    if (!isCurrentUser) {
      const kickBtn = document.createElement('button');
      kickBtn.className = 'kick-btn p-1 text-slate-400 hover:text-red-400 transition-colors';
      kickBtn.title = 'Remove from room';
      kickBtn.dataset.participantId = participantId || '';
      kickBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      `;
      kickBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (participantId) this.handleKickClick(participantId);
      });
      kickSlot?.appendChild(kickBtn);
    }
  }

  private async handleDemoteClick(participantId: string): Promise<void> {
    const button = document.querySelector(`.demote-btn[data-participant-id="${participantId}"]`) as HTMLElement;
    await this.withLoading(button, () => this.bloc.demoteFromManager(participantId));
  }

  private handleKickClick(participantId: string): void {
    this.pendingKickParticipantId = participantId;
    this.openKickModal();
  }

  private openKickModal(): void {
    this.elements.kickModal?.classList.remove('hidden');
  }

  private closeKickModal(): void {
    this.elements.kickModal?.classList.add('hidden');
    this.pendingKickParticipantId = null;
  }

  private async handleConfirmKick(): Promise<void> {
    if (!this.pendingKickParticipantId) return;

    const participantId = this.pendingKickParticipantId;

    const success = await this.withLoading(this.elements.confirmKickBtn, () =>
      this.bloc.kickParticipant(participantId)
    );

    if (success) {
      this.closeKickModal();
    }
  }

  // Avatar modal methods
  private openAvatarModal(): void {
    // Initialize selected avatar from current user
    const currentAvatar = this.elements.currentUserAvatar;
    if (currentAvatar) {
      (window as any).__selectedAvatarStyle = currentAvatar.dataset.avatarStyle || 'adventurer';
      (window as any).__selectedAvatarSeed = currentAvatar.dataset.avatarSeed || '';
    }
    // Use the Modal component's open function
    (window as unknown as Record<string, () => void>)['open_avatar-modal']?.();
  }

  private closeAvatarModal(): void {
    // Use the Modal component's close function
    (window as unknown as Record<string, () => void>)['close_avatar-modal']?.();
  }

  private async handleSaveAvatar(): Promise<void> {
    const style = (window as any).__selectedAvatarStyle;
    const seed = (window as any).__selectedAvatarSeed;

    if (!style || !seed) {
      return;
    }

    const success = await this.withLoading(this.elements.saveAvatarBtn, () =>
      this.bloc.updateAvatar(style, seed)
    );
    if (success) {
      // Update the current user avatar in the sidebar
      if (this.elements.currentUserAvatar) {
        this.elements.currentUserAvatar.src = getAvatarUrl(style, seed, 40);
        this.elements.currentUserAvatar.dataset.avatarStyle = style;
        this.elements.currentUserAvatar.dataset.avatarSeed = seed;
      }
      this.closeAvatarModal();
    }
  }
}
