import { Component, inject, signal } from '@angular/core';
import { AdminPanel } from './admin-panel/admin-panel';
import { ProjectGalleryService } from './project-gallery.service';

@Component({
  selector: 'app-root',
  imports: [AdminPanel],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly gallery = inject(ProjectGalleryService);
  protected readonly adminMode = signal(
    new URLSearchParams(window.location.search).get('admin') === '1',
  );
  protected readonly menuOpen = signal(false);
  protected readonly activeFilter = signal('Todos');
  protected readonly whatsappUrl =
    'https://wa.me/523521118244?text=Hola%20Fer%20Car%20Audio%2C%20quiero%20cotizar%20un%20proyecto%20para%20mi%20auto.';

  protected readonly projects = signal([
    { title: 'Audio SQL', type: 'Audio', detail: 'Sistema 3 vías · DSP · Subwoofer', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=85' },
    { title: 'Bajos a medida', type: 'Cajones', detail: 'Cajón sellado · Acabado OEM', image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=85' },
    { title: 'Iluminación interior', type: 'Iluminación', detail: 'Luz ambiental RGB · App móvil', image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=85' },
    { title: 'Pantalla multimedia', type: 'Multimedia', detail: 'CarPlay · Android Auto · Cámara', image: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=85' },
    { title: 'SQ Premium', type: 'Audio', detail: 'Insonorización · Afinación profesional', image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=85' },
    { title: 'Instalación invisible', type: 'Cajones', detail: 'Fibra de vidrio · Espacio original', image: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=1200&q=85' },
  ]);

  constructor() {
    if (!this.adminMode()) void this.loadPublishedProjects();
  }

  private async loadPublishedProjects() {
    try {
      const remoteProjects = await this.gallery.listPublished();
      if (remoteProjects.length) {
        this.projects.set(remoteProjects.map((project) => ({
          title: project.title,
          type: project.category,
          detail: project.description,
          image: project.image_url,
        })));
      }
    } catch {
      // Conserva la galería incluida en el sitio hasta que Supabase esté configurado.
    }
  }

  protected filteredProjects() {
    const filter = this.activeFilter();
    return filter === 'Todos' ? this.projects() : this.projects().filter((project) => project.type === filter);
  }

  protected setFilter(filter: string) {
    this.activeFilter.set(filter);
  }

  protected closeMenu() {
    this.menuOpen.set(false);
  }
}
