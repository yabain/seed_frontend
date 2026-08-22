import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadService } from '../../../core/services/upload.service';
import { ToastService } from '../../../core/services/toast.service';
import { dataUrlToFile, fileToWebp } from '../../utils/file.util';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

@Component({
  selector: 'app-admin-image-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-image-field.component.html',
  styleUrl: './admin-image-field.component.scss',
})
export class AdminImageFieldComponent implements OnChanges, OnDestroy {
  @Input() image: string | undefined | null = null;
  @Input() alt = 'Image';
  @Input() variant: 'wide' | 'square' = 'wide';
  @Input() maxWidth = 1600;
  @Input() maxHeight = 900;

  @Output() imageChange = new EventEmitter<string>();

  @ViewChild('fileInput')
  private fileInput?: ElementRef<HTMLInputElement>;

  readonly preview = signal<string | null>(null);
  readonly uploading = signal(false);
  readonly dragging = signal(false);

  private readonly objectUrls: string[] = [];

  constructor(
    private readonly uploadService: UploadService,
    private readonly toastService: ToastService,
  ) {
    this.preview.set(this.image ?? null);
  }

  openPicker(): void {
    if (this.uploading()) {
      return;
    }
    this.fileInput?.nativeElement.click();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['image'] && !this.uploading()) {
      this.preview.set(this.image ?? null);
    }
  }

  ngOnDestroy(): void {
    for (const url of this.objectUrls) {
      URL.revokeObjectURL(url);
    }
  }

  onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    target.value = '';
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(false);
    if (this.uploading()) {
      return;
    }
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  remove(): void {
    this.preview.set(null);
    this.imageChange.emit('');
  }

  private handleFile(file: File): void {
    if (file.size > MAX_IMAGE_SIZE) {
      this.toastService.warning('Image trop volumineuse (max 5 Mo).');
      return;
    }

    const previous = this.preview();
    this.preview.set(this.objectUrl(file));
    this.uploading.set(true);

    fileToWebp(file, this.maxWidth, this.maxHeight)
      .then(({ dataUrl, fileName }) => dataUrlToFile(dataUrl, fileName, 'image/webp'))
      .then((webpFile) => {
        const form = new FormData();
        form.append('file', webpFile);

        const oldPath = this.toStoredPath(this.image);
        if (oldPath) {
          form.append('oldPath', oldPath);
        }

        this.uploadService.uploadImage(form).subscribe({
          next: (result) => {
            this.uploading.set(false);
            this.preview.set(result.url);
            this.imageChange.emit(result.url);
          },
          error: () => {
            this.uploading.set(false);
            this.preview.set(previous);
            this.toastService.error('Échec du transfert de l’image.');
          },
        });
      })
      .catch(() => {
        this.uploading.set(false);
        this.preview.set(previous);
        this.toastService.error('Conversion de l’image impossible.');
      });
  }

  private objectUrl(file: File): string {
    const url = URL.createObjectURL(file);
    this.objectUrls.push(url);
    return url;
  }

  private toStoredPath(url?: string | null): string {
    if (!url) {
      return '';
    }
    if (url.startsWith('data:')) {
      return '';
    }
    const match = url.match(/\/uploads\/[^/?#]+$/);
    return match ? match[0] : '';
  }
}