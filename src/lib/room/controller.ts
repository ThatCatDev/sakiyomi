// Room UI Controller
// Connects the BLoC to the DOM - handles all UI updates and event bindings

import { RoomBloc, type RoomEvent } from './bloc';
import type { Participant, VotingStatus } from './types';

export class RoomController {
  private bloc: RoomBloc;

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

    // Join form
    joinForm: HTMLFormElement | null;
    joinError: HTMLElement | null;

    // Copy
    copyBtn: HTMLElement | null;
    roomUrlInput: HTMLInputElement | null;
    copyIcon: HTMLElement | null;
    checkIcon: HTMLElement | null;

    // Show votes toggle
    showVotesToggle: HTMLInputElement | null;
    showVotesDescription: HTMLElement | null;
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
    };
  }

  init(): void {
    this.bindEvents();
    this.bloc.subscribe(this.handleBlocEvent.bind(this));
    this.bloc.startRealtimeSubscription();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.bloc.dispose();
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
    this.elements.leaveModal?.addEventListener('click', (e) => {
      if (e.target === this.elements.leaveModal) this.closeLeaveModal();
    });

    // Escape key for modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.elements.leaveModal?.classList.contains('hidden')) {
        this.closeLeaveModal();
      }
    });

    // Join form
    this.elements.joinForm?.addEventListener('submit', (e) => this.handleJoinSubmit(e));

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
        break;
      case 'show_votes_changed':
        this.updateShowVotesUI(event.payload as boolean);
        break;
      case 'error':
        this.showError(event.payload as string);
        break;
    }
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

  private createParticipantElement(participant: Participant, animate = false): HTMLElement {
    const li = document.createElement('li');
    li.className = `flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50${animate ? ' participant-enter' : ''}`;
    li.dataset.participantId = participant.id;
    li.dataset.participantRole = participant.role;

    const isCurrentUser = participant.id === this.bloc.currentParticipantId;
    const initial = participant.name.charAt(0).toUpperCase();
    const hasVote = !!participant.current_vote;
    const showVote = this.bloc.votingStatus === 'revealed' && participant.current_vote;

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
    `;

    return li;
  }

  private updateParticipantCount(): void {
    const count = this.elements.participantsList?.querySelectorAll('li').length || 0;
    if (this.elements.participantCount) {
      this.elements.participantCount.textContent = String(count);
    }
    this.elements.noParticipants?.classList.toggle('hidden', count > 0);
  }

  // Color palette for pie chart slices - high contrast, easily distinguishable
  private static readonly PIE_COLORS = [
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
    const participants: { current_vote: string | null }[] = [];

    this.elements.participantsList?.querySelectorAll('li').forEach((li) => {
      const indicator = li.querySelector('.vote-indicator') as HTMLElement;
      const voteValue = indicator?.dataset.vote || null;
      participants.push({ current_vote: voteValue });
    });

    const { results, average } = RoomBloc.calculateResults(participants);

    // Render pie chart
    this.renderPieChart(results);

    // Render vote distribution
    if (this.elements.voteResults) {
      this.elements.voteResults.innerHTML = results.map(({ vote, count, percentage }, index) => {
        const color = RoomController.PIE_COLORS[index % RoomController.PIE_COLORS.length];
        return `
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg" style="background-color: ${color}">${vote}</span>
            <div>
              <span class="text-white font-medium">${count} vote${count > 1 ? 's' : ''}</span>
              <span class="text-slate-400 text-sm ml-1">(${Math.round(percentage)}%)</span>
            </div>
          </div>
        `;
      }).join('');
    }

    if (this.elements.voteAverage) {
      this.elements.voteAverage.textContent = average !== null ? average.toFixed(1) : '-';
    }
  }

  private renderPieChart(results: { vote: string; count: number; percentage: number }[]): void {
    if (!this.elements.pieChart || !this.elements.pieLegend) return;

    const totalVotes = results.reduce((sum, r) => sum + r.count, 0);

    if (totalVotes === 0) {
      // Show empty state
      this.elements.pieChart.innerHTML = `
        <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" stroke-width="20" />
      `;
      this.elements.pieLegend.innerHTML = '';
      return;
    }

    // Create pie slices using stroke-dasharray and stroke-dashoffset
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    let currentOffset = 0;

    const slices: string[] = [];
    const legendItems: string[] = [];

    results.forEach(({ vote, percentage }, index) => {
      const color = RoomController.PIE_COLORS[index % RoomController.PIE_COLORS.length];
      const strokeLength = (percentage / 100) * circumference;
      const gapLength = circumference - strokeLength;

      slices.push(`
        <circle
          cx="50"
          cy="50"
          r="${radius}"
          fill="none"
          stroke="${color}"
          stroke-width="20"
          stroke-dasharray="${strokeLength} ${gapLength}"
          stroke-dashoffset="${-currentOffset}"
          class="pie-slice"
        />
      `);

      legendItems.push(`
        <div class="flex items-center gap-1">
          <div class="w-2 h-2 rounded-full" style="background-color: ${color}"></div>
          <span class="text-xs text-slate-300">${vote}</span>
        </div>
      `);

      currentOffset += strokeLength;
    });

    this.elements.pieChart.innerHTML = slices.join('');
    this.elements.pieLegend.innerHTML = legendItems.join('');
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
    this.elements.leaveModal?.classList.remove('hidden', 'closing');
  }

  private closeLeaveModal(): void {
    this.elements.leaveModal?.classList.add('closing');
    setTimeout(() => {
      this.elements.leaveModal?.classList.add('hidden');
      this.elements.leaveModal?.classList.remove('closing');
    }, 150);
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
}
