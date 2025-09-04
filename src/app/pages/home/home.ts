import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LanguageSwitcherComponent } from '../../language-switcher/language-switcher';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, RouterModule, TranslateModule, LanguageSwitcherComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home {
  constructor(public translate: TranslateService) {
    translate.setFallbackLang('ro');
    translate.use('ro');
  }
}
