import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomePage } from './home.page';
import { LanguageService } from '../services/language.service';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        { provide: LanguageService, useValue: { t: (key: string) => key } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
