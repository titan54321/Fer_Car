import { Injectable } from '@angular/core';
import { createClient, Session } from '@supabase/supabase-js';
import { environment } from '../environments/environment.generated';

export type GalleryProject = {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string;
  image_path: string;
  position: number;
  published: boolean;
};

@Injectable({ providedIn: 'root' })
export class ProjectGalleryService {
  private readonly client = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  readonly adminEmail = environment.adminEmail;

  async getSession(): Promise<Session | null> {
    const { data } = await this.client.auth.getSession();
    return data.session;
  }

  async signIn(email: string, password: string) {
    if (email.toLowerCase() !== this.adminEmail) {
      throw new Error('Este correo no tiene acceso al panel.');
    }
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session;
  }

  async signOut() {
    await this.client.auth.signOut();
  }

  async listPublished(): Promise<GalleryProject[]> {
    const { data, error } = await this.client.from('projects').select('*').eq('published', true).order('position').order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async listAll(): Promise<GalleryProject[]> {
    const { data, error } = await this.client.from('projects').select('*').order('position').order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async createProject(input: { title: string; category: string; description: string; file: File }) {
    const extension = input.file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await this.client.storage.from('project-images').upload(path, input.file, { contentType: input.file.type });
    if (uploadError) throw uploadError;
    const { data: publicUrl } = this.client.storage.from('project-images').getPublicUrl(path);
    const { data, error } = await this.client.from('projects').insert({
      title: input.title,
      category: input.category,
      description: input.description,
      image_path: path,
      image_url: publicUrl.publicUrl,
      published: true,
    }).select().single();
    if (error) {
      await this.client.storage.from('project-images').remove([path]);
      throw error;
    }
    return data as GalleryProject;
  }

  async deleteProject(project: GalleryProject) {
    const { error } = await this.client.from('projects').delete().eq('id', project.id);
    if (error) throw error;
    if (project.image_path) await this.client.storage.from('project-images').remove([project.image_path]);
  }
}
