import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NewIssueActionsSummaryComponent } from '../actions-summary/actions-summary.component';
import { AlertsService } from 'src/app/services/alerts.service';
import { IssueCreationActionsService } from 'src/app/services/issue-creation-actions.service';
import { IGitlabIssue } from 'src/app/interfaces/gitlab/igitlab-issue';

@Component({
  selector: 'app-creation-summary-modal',
  standalone: true,
  imports: [CommonModule, NewIssueActionsSummaryComponent],
  templateUrl: './creation-summary-modal.component.html',
})
export class CreationSummaryModalComponent {
  @Input() showModal = false;
  @Input() closeButtonActivated = false;
  @Input() selectedProject?: IGitlabIssue = undefined;

  @Output() showModalEvent = new EventEmitter<boolean>();

  constructor(
    private alertsService: AlertsService,
    public actionsService: IssueCreationActionsService,
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['showModal']) {
      this.handleBodyScroll();
    }
  }

  openProjectInNewTab() {
    window.open(this.selectedProject?.web_url, '_blank');
  }

  toggleModal() {
    this.showModal = !this.showModal;
    this.handleBodyScroll();
    this.showModalEvent.emit(this.showModal);
  }

  private handleBodyScroll() {
    if (this.showModal) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }
}
