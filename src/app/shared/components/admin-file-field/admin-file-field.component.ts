import { Component, ElementRef, EventEmitter, Input, Output, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-file-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-file-field.component.html',
  styleUrl: './admin-file-field.component.scss',
})
export class AdminFileFieldComponent {
  @Input() accept = '';
  @Input() hint = '';
  @Input() currentFileName = '';
  @Input() disabled = false;

  @Output() fileChange = new EventEmitter<File | null>();

  @ViewChild('fileInput')
  private fileInput?: ElementRef<HTMLInputElement>;

  readonly dragging = signal(false);
  readonly selected = signal<File | null>(null);

  openPicker(): void {
    if (this.disabled) return;
    this.fileInput?.nativeElement.click();
  }

  onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    target.value = '';
    if (file) this.setFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled) this.dragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(false);
    if (this.disabled) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setFile(file);
  }

  clear(): void {
    this.selected.set(null);
    this.fileChange.emit(null);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  private setFile(file: File): void {
    this.selected.set(file);
    this.fileChange.emit(file);
  }
}
