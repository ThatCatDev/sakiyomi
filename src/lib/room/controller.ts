// Room UI Controller
// Connects the BLoC to the DOM - handles all UI updates and event bindings

import { RoomBloc, type RoomEvent } from './bloc';
import type { Participant, VotingStatus } from './types';

export class RoomController {
  private bloc: RoomBloc;
  private pendingKickParticipantId: string | null = null;

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
    statusWaiting: HTMLElement | null;
    statusVoting: HTMLElement | null;
    statusRevealed: HTMLElement | null;

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
      statusWaiting: document.getElementById('status-waiting'),
      statusVoting: document.getElementById('status-voting'),
      statusRevealed: document.getElementById('status-revealed'),

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
    };
  }

  init(): void {
    this.bindEvents();
    this.bindPromoteButtons();
    this.bloc.subscribe(this.handleBlocEvent.bind(this));
    this.bloc.startRealtimeSubscription();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.bloc.dispose();
    });
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
          ? 'All participants can see who voted what'
          : 'Votes are shown anonymously';
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
        // Also update own vote indicator immediately (don't wait for realtime)
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
      case 'error':
        this.showError(event.payload as string);
        break;
    }
  }

  private handleKicked(): void {
    alert('You have been removed from this room by a manager.');
    window.location.reload();
  }

  // UI Update methods
  private updateVotingStatusUI(status: VotingStatus): void {
    // Update status banners
    this.elements.statusWaiting?.classList.toggle('hidden', status !== 'waiting');
    this.elements.statusVoting?.classList.toggle('hidden', status !== 'voting');
    this.elements.statusRevealed?.classList.toggle('hidden', status !== 'revealed');

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
      this.clearVoteIndicators();
      this.clearVoteCardSelection();
      if (this.elements.yourVoteDisplay) this.elements.yourVoteDisplay.textContent = '-';
    }

    if (status === 'revealed') {
      this.revealAllVotes();
      this.calculateAndShowResults();
      // Manager always sees who voted what, others only if showVotes is enabled
      if (this.bloc.isManager || this.bloc.showVotes) {
        this.updateParticipantVoteDisplay(true);
      }
    } else {
      // Clear vote display when not revealed
      this.updateParticipantVoteDisplay(false);
    }
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

  private clearVoteIndicators(): void {
    this.elements.participantsList?.querySelectorAll('.vote-indicator').forEach((indicator) => {
      const el = indicator as HTMLElement;
      el.dataset.hasVote = 'false';
      el.dataset.vote = '';
      el.className = 'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold vote-indicator bg-slate-600 text-slate-400';
      el.innerHTML = '<span>?</span>';
    });
  }

  private revealAllVotes(): void {
    this.elements.participantsList?.querySelectorAll('.vote-indicator').forEach((indicator) => {
      const el = indicator as HTMLElement;
      const vote = el.dataset.vote;
      if (vote) {
        el.innerHTML = `<span class="vote-value">${vote}</span>`;
      }
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

    const initialEl = el.querySelector('.participant-initial');
    if (initialEl) initialEl.textContent = participant.name.charAt(0).toUpperCase();

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

    indicator.dataset.hasVote = vote ? 'true' : 'false';
    indicator.dataset.vote = vote || '';
    indicator.className = `absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold vote-indicator ${vote ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-400'}`;

    if (this.bloc.votingStatus === 'revealed' && vote) {
      indicator.innerHTML = `<span class="vote-value">${vote}</span>`;
    } else if (vote) {
      indicator.innerHTML = `<svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>`;
    } else {
      indicator.innerHTML = `<span>?</span>`;
    }
  }

  private updateOwnVoteIndicator(vote: string): void {
    // Find the current user's participant element and update their vote indicator
    const currentParticipantId = this.bloc.currentParticipantId;
    if (!currentParticipantId) return;

    const el = this.elements.participantsList?.querySelector(`[data-participant-id="${currentParticipantId}"]`);
    if (!el) return;

    this.updateVoteIndicator(el, vote);

    // Also update the "Your vote" display
    if (this.elements.yourVoteDisplay) {
      this.elements.yourVoteDisplay.textContent = vote || '-';
    }
  }

  private createParticipantElement(participant: Participant, animate = false): HTMLElement {
    const li = document.createElement('li');
    li.className = `flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50${animate ? ' participant-enter' : ''}`;
    li.dataset.participantId = participant.id;
    li.dataset.participantRole = participant.role;

    const isCurrentUser = participant.id === this.bloc.currentParticipantId;
    const initial = participant.name.charAt(0).toUpperCase();
    const hasVote = !!participant.current_vote;
    const showVote = this.bloc.votingStatus === 'revealed' && participant.current_vote;
    const canPromote = this.bloc.isManager && !isCurrentUser && participant.role !== 'manager';
    const canDemote = this.bloc.isManager && participant.role === 'manager';
    const canKick = this.bloc.isManager && !isCurrentUser;

    li.innerHTML = `
      <div class="relative flex-shrink-0">
        <div class="w-8 h-8 bg-indigo-600/80 rounded-full flex items-center justify-center">
          <span class="text-white text-sm font-medium participant-initial">${initial}</span>
        </div>
        <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold vote-indicator ${hasVote ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-400'}" data-has-vote="${hasVote}" data-vote="${participant.current_vote || ''}">
          ${showVote ? `<span class="vote-value">${participant.current_vote}</span>` : hasVote ? '<svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>' : '<span>?</span>'}
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <span class="text-white text-sm truncate block participant-name">${participant.name}</span>
        ${participant.role === 'manager' ? '<span class="text-xs text-indigo-400">Manager</span>' : ''}
      </div>
      ${isCurrentUser ? '<span class="text-xs text-slate-500">(you)</span>' : ''}
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
      ${canKick ? `
        <button class="kick-btn p-1 text-slate-400 hover:text-red-400 transition-colors" title="Remove from room" data-participant-id="${participant.id}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ` : ''}
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
    const success = await this.bloc.promoteToManager(participantId);
    if (!success) {
      // Error already emitted by bloc
    }
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
    await this.bloc.startVoting(topic);
  }

  private async handleRevealVotes(): Promise<void> {
    await this.bloc.revealVotes();
  }

  private async handleResetVotes(): Promise<void> {
    await this.bloc.resetVotes();
  }

  private async handleNewRound(): Promise<void> {
    const topic = this.elements.nextTopicInput?.value || '';
    const success = await this.bloc.startVoting(topic);
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
        ? 'All participants can see who voted what'
        : 'Votes are shown anonymously';
    }

    // Update vote display in participant list based on current voting status
    // Manager always sees votes, others only if showVotes is enabled
    if (this.bloc.votingStatus === 'revealed') {
      this.updateParticipantVoteDisplay(this.bloc.isManager || showVotes);
    }
  }

  private updateParticipantVoteDisplay(showVotes: boolean): void {
    this.elements.participantsList?.querySelectorAll('li').forEach((li) => {
      const indicator = li.querySelector('.vote-indicator') as HTMLElement;
      if (!indicator) return;

      const vote = indicator.dataset.vote;
      const hasVote = indicator.dataset.hasVote === 'true';
      const participantName = li.querySelector('.participant-name')?.textContent || '';

      if (showVotes && vote) {
        // Show vote value next to name
        const voteDisplay = li.querySelector('.vote-display');
        if (!voteDisplay) {
          const nameEl = li.querySelector('.participant-name');
          if (nameEl) {
            const span = document.createElement('span');
            span.className = 'vote-display text-indigo-400 text-sm ml-2';
            span.textContent = `voted ${vote}`;
            nameEl.parentNode?.appendChild(span);
          }
        } else {
          (voteDisplay as HTMLElement).textContent = `voted ${vote}`;
        }
      } else {
        // Hide vote value next to name
        li.querySelector('.vote-display')?.remove();
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

    const success = await this.bloc.updateName(name);

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
    const success = await this.bloc.leaveRoom();
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
        ? 'All participants can see who voted what'
        : 'Votes are shown anonymously';
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

    const success = await this.bloc.updateSettings({
      name,
      showVotes,
      voteOptions,
    });

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
    document.title = `${name} - Sakiyomi`;
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
      li.appendChild(demoteBtn);
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
        li.appendChild(promoteBtn);
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
      li.appendChild(kickBtn);
    }
  }

  private async handleDemoteClick(participantId: string): Promise<void> {
    const success = await this.bloc.demoteFromManager(participantId);
    if (!success) {
      // Error already emitted by bloc
    }
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
    this.closeKickModal();

    const success = await this.bloc.kickParticipant(participantId);
    if (!success) {
      // Error already emitted by bloc
    }
  }
}
