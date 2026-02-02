import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
    selector: '[appResizable]',
    standalone: true
})
export class ResizableDirective {
    private startX!: number;
    private startWidth!: number;
    private column: HTMLElement;

    constructor(private el: ElementRef, private renderer: Renderer2) {
        this.column = this.el.nativeElement;
    }

    @HostListener('mousedown', ['$event'])
    onMouseDown(event: MouseEvent) {
        if ((event.target as HTMLElement).classList.contains('resize-handle')) {
            this.startX = event.pageX;
            this.startWidth = this.column.offsetWidth;

            const mouseMoveSub = this.renderer.listen('document', 'mousemove', (e) => this.onMouseMove(e));
            const mouseUpSub = this.renderer.listen('document', 'mouseup', () => {
                mouseMoveSub();
                mouseUpSub();
                this.renderer.removeClass(document.body, 'resizing');
            });

            this.renderer.addClass(document.body, 'resizing');
            event.preventDefault();
        }
    }

    onMouseMove(event: MouseEvent) {
        const newWidth = this.startWidth + (event.pageX - this.startX);
        if (newWidth > 60) {
            // Setting all three ensures 'table-layout: fixed' enforces the size
            this.renderer.setStyle(this.column, 'width', `${newWidth}px`);
            this.renderer.setStyle(this.column, 'min-width', `${newWidth}px`);
            this.renderer.setStyle(this.column, 'max-width', `${newWidth}px`);
        }
    }
}