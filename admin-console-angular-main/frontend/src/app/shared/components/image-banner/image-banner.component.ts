import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-image-banner',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './image-banner.component.html',
  styleUrls: ['./image-banner.component.scss']
})
export class ImageBannerComponent implements OnInit {
  @Input() greetingText: string = 'Hello';
  
  currentUser: string = 'User';

  constructor(
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userName = this.authService.getCurrentUserName();
    if (userName) {
      this.currentUser = userName;
    }
  }
}