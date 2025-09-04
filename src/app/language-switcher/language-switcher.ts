import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, HostListener, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './language-switcher.html',
  styleUrls: ['./language-switcher.css']
})
export class LanguageSwitcherComponent implements OnInit {
  languages = [
    { code: 'ro', label: 'Română' },
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' }
  ];

  isOpen = false;
  currentLang = 'ro';

  constructor(
    private translate: TranslateService,
    private el: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    const defaultLang = 'ro';
    this.translate.setFallbackLang(defaultLang);

    const browser = isPlatformBrowser(this.platformId);
    const stored = browser ? localStorage.getItem('lang') : null;
    const browserLang = this.normalize( this.translate.getBrowserLang() );

    const initial =
      stored && this.isSupported(stored) ? stored :
      browserLang && this.isSupported(browserLang) ? browserLang :
      defaultLang;

    this.use(initial);
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  select(lang: string): void {
    if (lang !== this.currentLang && this.isSupported(lang)) {
      this.use(lang);
    }
    this.isOpen = false;
  }

  private use(lang: string): void {
    const browser = isPlatformBrowser(this.platformId);
    this.translate.use(lang);
    this.currentLang = lang;
    if (browser) {
      localStorage.setItem('lang', lang);
      document.documentElement.setAttribute('lang', lang);
    }
  }

  private isSupported(code: string | null | undefined): code is string {
    return !!code && this.languages.some(l => l.code === code);
  }

  private normalize(code?: string | null): string | null {
    // e.g. "en-GB" -> "en"
    if (!code) return null;
    return code.toLowerCase().split('-')[0];
  }

  // close picker on outside click
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    if (this.isOpen && !this.el.nativeElement.contains(ev.target as Node)) {
      this.isOpen = false;
    }
  }

  // keyboard accessibility
  @HostListener('document:keydown.escape')
  onEsc() {
    this.isOpen = false;
  }
}
