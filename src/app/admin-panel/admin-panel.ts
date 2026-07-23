import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GalleryProject, ProjectGalleryService } from '../project-gallery.service';

@Component({
  selector: 'app-admin-panel',
  imports: [FormsModule],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.css',
})
export class AdminPanel {
  private readonly gallery = inject(ProjectGalleryService);
  private selectedFile: File | null = null;

  protected readonly authenticated = signal(false);
  protected readonly checkingSession = signal(true);
  protected readonly working = signal(false);
  protected readonly mobileNavOpen = signal(false);
  protected readonly activeSection = signal<'projects' | 'upload' | 'settings'>('projects');
  protected readonly previewUrl = signal('');
  protected readonly notice = signal('');
  protected readonly error = signal('');
  protected readonly projects = signal<GalleryProject[]>([]);
  protected readonly login = { email: this.gallery.adminEmail, password: '' };
  protected readonly draft = { title: '', category: 'Audio', description: '' };

  constructor() {
    void this.restoreSession();
  }

  private async restoreSession() {
    try {
      const session = await this.gallery.getSession();
      this.authenticated.set(session?.user.email?.toLowerCase() === this.gallery.adminEmail);
      if (this.authenticated()) await this.loadProjects();
    } finally {
      this.checkingSession.set(false);
    }
  }

  protected async signIn() {
    this.error.set('');
    this.working.set(true);
    try {
      await this.gallery.signIn(this.login.email, this.login.password);
      this.authenticated.set(true);
      this.login.password = '';
      await this.loadProjects();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible iniciar sesión.');
    } finally {
      this.working.set(false);
    }
  }

  protected async signOut() {
    await this.gallery.signOut();
    this.authenticated.set(false);
    this.projects.set([]);
  }

  private async loadProjects() {
    try {
      this.projects.set(await this.gallery.listAll());
    } catch {
      this.error.set('Falta ejecutar la configuración inicial de la base de datos en Supabase.');
    }
  }

  protected selectSection(section: 'projects' | 'upload' | 'settings') {
    this.activeSection.set(section);
    this.mobileNavOpen.set(false);
    this.notice.set('');
    this.error.set('');
  }

  protected chooseFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      this.error.set('La fotografía supera el límite de 8 MB.');
      return;
    }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  }

  protected async publish() {
    this.error.set('');
    if (!this.draft.title || !this.selectedFile) {
      this.error.set('Agrega una fotografía y el nombre del proyecto.');
      return;
    }
    this.working.set(true);
    try {
      const project = await this.gallery.createProject({ ...this.draft, file: this.selectedFile });
      this.projects.update((items) => [project, ...items]);
      this.notice.set('Proyecto publicado correctamente en la galería.');
      this.resetDraft();
      this.activeSection.set('projects');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible publicar el proyecto.');
    } finally {
      this.working.set(false);
    }
  }

  protected async remove(project: GalleryProject) {
    if (!window.confirm(`¿Eliminar “${project.title}” de la galería?`)) return;
    this.working.set(true);
    try {
      await this.gallery.deleteProject(project);
      this.projects.update((items) => items.filter((item) => item.id !== project.id));
      this.notice.set('Proyecto eliminado correctamente.');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible eliminar el proyecto.');
    } finally {
      this.working.set(false);
    }
  }

  protected resetDraft() {
    this.draft.title = '';
    this.draft.category = 'Audio';
    this.draft.description = '';
    this.selectedFile = null;
    this.previewUrl.set('');
  }
}
