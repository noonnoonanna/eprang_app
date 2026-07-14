(function (global) {
  'use strict';

  const DEFAULT_LAYOUT = {
    drawing: {
      title: '실내 스마트팜 배치도',
      drawingNo: 'EPRANG-LAYOUT-0001',
      company: '주식회사 이피랑',
      createdBy: '이피랑 AI 설계',
      approvedBy: '',
      date: new Date().toISOString().slice(0, 10),
      revision: 'A',
      sheet: '1/1'
    },
    room: {
      widthMm: 12000,
      heightMm: 6000,
      wallThicknessMm: 120
    },
    racks: [
      {
        id: 'rack-a',
        xMm: 1800,
        yMm: 900,
        widthMm: 7800,
        heightMm: 2300,
        columns: 8,
        rows: 5,
        levels: 4,
        label: '재배랙 A'
      },
      {
        id: 'rack-b',
        xMm: 3800,
        yMm: 3300,
        widthMm: 5800,
        heightMm: 1700,
        columns: 6,
        rows: 4,
        levels: 4,
        label: '재배랙 B'
      }
    ],
    equipment: [
      { id: 'ac-1', type: 'aircon', xMm: 1300, yMm: 250, widthMm: 650, heightMm: 300, label: '에어컨' },
      { id: 'ac-2', type: 'aircon', xMm: 9750, yMm: 250, widthMm: 650, heightMm: 300, label: '에어컨' },
      { id: 'fan-1', type: 'fan', xMm: 2100, yMm: 5000, radiusMm: 430, label: '순환팬' },
      { id: 'tank-1', type: 'tank', xMm: 550, yMm: 2700, widthMm: 420, heightMm: 620, label: '양액탱크' }
    ],
    doors: [
      { id: 'door-1', wall: 'bottom', offsetMm: 950, widthMm: 1100, swing: 'right' }
    ],
    dimensions: [
      { from: [1800, 3550], to: [0, 3550], offsetMm: 0, label: '1800' },
      { from: [1800, 3950], to: [0, 3950], offsetMm: 0, label: '1800' },
      { from: [9600, 2100], to: [12000, 2100], offsetMm: 0, label: '2400' },
      { from: [6400, 900], to: [6400, 0], offsetMm: 0, label: '900' },
      { from: [7900, 5000], to: [7900, 6000], offsetMm: 0, label: '1000' }
    ],
    note: '본 도면은 AI 기반 기본 배치 초안이며, 현장 실측 및 전문 설계 검토 후 최종 확정됩니다.'
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mergeDeep(target, source) {
    const output = Array.isArray(target) ? [...target] : { ...target };
    if (!source || typeof source !== 'object') return output;

    Object.keys(source).forEach((key) => {
      const sourceValue = source[key];
      const targetValue = output[key];

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        output[key] = mergeDeep(targetValue, sourceValue);
      } else {
        output[key] = clone(sourceValue);
      }
    });

    return output;
  }

  class EprangLayoutCanvas {
    constructor(canvas, layout = {}, options = {}) {
      if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error('유효한 canvas 요소가 필요합니다.');
      }

      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.layout = mergeDeep(DEFAULT_LAYOUT, layout);
      this.options = {
        width: options.width || 1500,
        height: options.height || 1050,
        background: options.background || '#ffffff',
        lineColor: options.lineColor || '#111827',
        mutedColor: options.mutedColor || '#64748b',
        accentColor: options.accentColor || '#15803d',
        showGridReference: options.showGridReference !== false,
        ...options
      };

      this.viewport = {
        pageX: 48,
        pageY: 30,
        pageWidth: this.options.width - 96,
        pageHeight: this.options.height - 60,
        drawingX: 220,
        drawingY: 185,
        drawingWidth: 1040,
        drawingHeight: 510,
        titleBlockX: 790,
        titleBlockY: 830,
        titleBlockWidth: 660,
        titleBlockHeight: 170
      };

      this.resize(this.options.width, this.options.height);
      this.render();
    }

    resize(width, height) {
      const ratio = Math.max(1, window.devicePixelRatio || 1);
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.canvas.width = Math.round(width * ratio);
      this.canvas.height = Math.round(height * ratio);
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      this.options.width = width;
      this.options.height = height;
    }

    setLayout(layout) {
      this.layout = mergeDeep(DEFAULT_LAYOUT, layout);
      this.render();
    }

    getLayout() {
      return clone(this.layout);
    }

    mmToX(mm) {
      return this.viewport.drawingX +
        (mm / this.layout.room.widthMm) * this.viewport.drawingWidth;
    }

    mmToY(mm) {
      return this.viewport.drawingY +
        (mm / this.layout.room.heightMm) * this.viewport.drawingHeight;
    }

    mmToWidth(mm) {
      return (mm / this.layout.room.widthMm) * this.viewport.drawingWidth;
    }

    mmToHeight(mm) {
      return (mm / this.layout.room.heightMm) * this.viewport.drawingHeight;
    }

    render() {
      const ctx = this.ctx;
      ctx.save();
      ctx.clearRect(0, 0, this.options.width, this.options.height);
      ctx.fillStyle = this.options.background;
      ctx.fillRect(0, 0, this.options.width, this.options.height);

      this.drawPageFrame();
      if (this.options.showGridReference) this.drawGridReference();
      this.drawRoom();
      this.drawRacks();
      this.drawEquipment();
      this.drawDoors();
      this.drawDimensions();
      this.drawTitleBlock();
      this.drawNote();

      ctx.restore();
    }

    drawPageFrame() {
      const { ctx, viewport } = this;
      ctx.save();
      ctx.strokeStyle = this.options.lineColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(
        viewport.pageX,
        viewport.pageY,
        viewport.pageWidth,
        viewport.pageHeight
      );
      ctx.restore();
    }

    drawGridReference() {
      const { ctx, viewport } = this;
      const topLabels = ['1','2','3','4','5','6','7','8'];
      const sideLabels = ['A','B','C','D','E','F'];

      ctx.save();
      ctx.strokeStyle = this.options.mutedColor;
      ctx.fillStyle = this.options.lineColor;
      ctx.lineWidth = 0.7;
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      topLabels.forEach((label, index) => {
        const x = viewport.pageX + ((index + 0.5) / topLabels.length) * viewport.pageWidth;
        ctx.fillText(label, x, viewport.pageY - 10);
        ctx.fillText(label, x, viewport.pageY + viewport.pageHeight + 10);

        if (index > 0) {
          const tickX = viewport.pageX + (index / topLabels.length) * viewport.pageWidth;
          ctx.beginPath();
          ctx.moveTo(tickX, viewport.pageY - 17);
          ctx.lineTo(tickX, viewport.pageY + 17);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(tickX, viewport.pageY + viewport.pageHeight - 17);
          ctx.lineTo(tickX, viewport.pageY + viewport.pageHeight + 17);
          ctx.stroke();
        }
      });

      sideLabels.forEach((label, index) => {
        const y = viewport.pageY + ((index + 0.5) / sideLabels.length) * viewport.pageHeight;
        ctx.fillText(label, viewport.pageX - 11, y);
        ctx.fillText(label, viewport.pageX + viewport.pageWidth + 11, y);

        if (index > 0) {
          const tickY = viewport.pageY + (index / sideLabels.length) * viewport.pageHeight;
          ctx.beginPath();
          ctx.moveTo(viewport.pageX - 17, tickY);
          ctx.lineTo(viewport.pageX + 17, tickY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(viewport.pageX + viewport.pageWidth - 17, tickY);
          ctx.lineTo(viewport.pageX + viewport.pageWidth + 17, tickY);
          ctx.stroke();
        }
      });

      ctx.restore();
    }

    drawRoom() {
      const { ctx, viewport } = this;
      ctx.save();
      ctx.strokeStyle = this.options.lineColor;
      ctx.lineWidth = 1.3;
      ctx.strokeRect(
        viewport.drawingX,
        viewport.drawingY,
        viewport.drawingWidth,
        viewport.drawingHeight
      );

      const pillarSize = 12;
      const pillarPositions = [
        [0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],
        [0,1],[0.25,1],[0.5,1],[0.75,1],[1,1]
      ];

      pillarPositions.forEach(([px, py]) => {
        const x = viewport.drawingX + px * viewport.drawingWidth;
        const y = viewport.drawingY + py * viewport.drawingHeight;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - pillarSize / 2, y - pillarSize / 2, pillarSize, pillarSize);
        ctx.strokeRect(x - pillarSize / 2, y - pillarSize / 2, pillarSize, pillarSize);
      });

      ctx.restore();
    }

    drawRacks() {
      this.layout.racks.forEach((rack) => this.drawRack(rack));
    }

    drawRack(rack) {
      const { ctx } = this;
      const x = this.mmToX(rack.xMm);
      const y = this.mmToY(rack.yMm);
      const w = this.mmToWidth(rack.widthMm);
      const h = this.mmToHeight(rack.heightMm);
      const columns = Math.max(1, rack.columns || 1);
      const rows = Math.max(1, rack.rows || 1);

      ctx.save();
      ctx.strokeStyle = this.options.lineColor;
      ctx.lineWidth = 1.1;
      ctx.strokeRect(x, y, w, h);

      for (let col = 1; col < columns; col++) {
        const lineX = x + (col / columns) * w;
        ctx.beginPath();
        ctx.moveTo(lineX, y);
        ctx.lineTo(lineX, y + h);
        ctx.stroke();
      }

      for (let row = 1; row < rows; row++) {
        const lineY = y + (row / rows) * h;
        ctx.beginPath();
        ctx.moveTo(x, lineY);
        ctx.lineTo(x + w, lineY);
        ctx.stroke();
      }

      const trayLines = Math.max(2, rack.levels || 4);
      for (let level = 0; level < trayLines; level++) {
        const offset = 2 + level * 3;
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.moveTo(x, y + offset);
        ctx.lineTo(x + w, y + offset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, y + h - offset);
        ctx.lineTo(x + w, y + h - offset);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.restore();
    }

    drawEquipment() {
      this.layout.equipment.forEach((item) => {
        if (item.type === 'aircon') this.drawAircon(item);
        if (item.type === 'fan') this.drawFan(item);
        if (item.type === 'tank') this.drawTank(item);
      });
    }

    drawAircon(item) {
      const { ctx } = this;
      const x = this.mmToX(item.xMm);
      const y = this.mmToY(item.yMm);
      const w = this.mmToWidth(item.widthMm || 650);
      const h = this.mmToHeight(item.heightMm || 300);

      ctx.save();
      ctx.strokeStyle = this.options.lineColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
      ctx.font = 'bold 13px Pretendard, Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = this.options.lineColor;
      ctx.fillText(item.label || '에어컨', x + w / 2, y + h / 2);
      ctx.restore();
    }

    drawFan(item) {
      const { ctx } = this;
      const x = this.mmToX(item.xMm);
      const y = this.mmToY(item.yMm);
      const r = Math.max(18, this.mmToWidth(item.radiusMm || 430));

      ctx.save();
      ctx.strokeStyle = this.options.lineColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, r * 0.22, 0, Math.PI * 2);
      ctx.stroke();

      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(i * Math.PI / 2);
        ctx.strokeRect(-r * 0.15, -r * 0.75, r * 0.3, r * 0.55);
        ctx.restore();
      }

      ctx.restore();
    }

    drawTank(item) {
      const { ctx } = this;
      const x = this.mmToX(item.xMm);
      const y = this.mmToY(item.yMm);
      const w = this.mmToWidth(item.widthMm || 420);
      const h = this.mmToHeight(item.heightMm || 620);

      ctx.save();
      ctx.strokeStyle = this.options.lineColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + 8, w / 2, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    drawDoors() {
      this.layout.doors.forEach((door) => {
        const { ctx, viewport } = this;
        const width = this.mmToWidth(door.widthMm || 1000);
        ctx.save();
        ctx.strokeStyle = this.options.lineColor;
        ctx.lineWidth = 1;

        if (door.wall === 'bottom') {
          const x = this.mmToX(door.offsetMm || 0);
          const y = viewport.drawingY + viewport.drawingHeight;
          ctx.clearRect(x - 2, y - 3, width + 4, 8);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y - width);
          ctx.arc(x, y, width, -Math.PI / 2, 0);
          ctx.stroke();
        }

        ctx.restore();
      });
    }

    drawDimensions() {
      this.layout.dimensions.forEach((dimension) => {
        this.drawDimension(dimension);
      });
    }

    drawDimension(dimension) {
      const { ctx } = this;
      const [x1Mm, y1Mm] = dimension.from;
      const [x2Mm, y2Mm] = dimension.to;
      const x1 = this.mmToX(x1Mm);
      const y1 = this.mmToY(y1Mm);
      const x2 = this.mmToX(x2Mm);
      const y2 = this.mmToY(y2Mm);

      ctx.save();
      ctx.strokeStyle = this.options.lineColor;
      ctx.fillStyle = this.options.lineColor;
      ctx.lineWidth = 0.9;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      this.drawArrowHead(x1, y1, x2, y2);
      this.drawArrowHead(x2, y2, x1, y1);

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);

      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (vertical) {
        ctx.save();
        ctx.translate(midX - 10, midY);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-25, -8, 50, 16);
        ctx.fillStyle = this.options.lineColor;
        ctx.fillText(dimension.label || '', 0, 0);
        ctx.restore();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(midX - 25, midY - 8, 50, 16);
        ctx.fillStyle = this.options.lineColor;
        ctx.fillText(dimension.label || '', midX, midY);
      }

      ctx.restore();
    }

    drawArrowHead(x, y, towardX, towardY) {
      const { ctx } = this;
      const angle = Math.atan2(towardY - y, towardX - x);
      const size = 7;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(angle + Math.PI / 6) * size,
        y + Math.sin(angle + Math.PI / 6) * size
      );
      ctx.lineTo(
        x + Math.cos(angle - Math.PI / 6) * size,
        y + Math.sin(angle - Math.PI / 6) * size
      );
      ctx.closePath();
      ctx.fill();
    }

    drawTitleBlock() {
      const { ctx, viewport } = this;
      const drawing = this.layout.drawing;
      const x = viewport.titleBlockX;
      const y = viewport.titleBlockY;
      const w = viewport.titleBlockWidth;
      const h = viewport.titleBlockHeight;

      ctx.save();
      ctx.strokeStyle = this.options.lineColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);

      const left = w * 0.34;
      const middle = w * 0.68;
      ctx.beginPath();
      ctx.moveTo(x + left, y);
      ctx.lineTo(x + left, y + h);
      ctx.moveTo(x + middle, y);
      ctx.lineTo(x + middle, y + h);
      ctx.moveTo(x, y + 34);
      ctx.lineTo(x + w, y + 34);
      ctx.moveTo(x + left, y + 74);
      ctx.lineTo(x + w, y + 74);
      ctx.moveTo(x + middle, y + 112);
      ctx.lineTo(x + w, y + 112);
      ctx.stroke();

      ctx.fillStyle = this.options.mutedColor;
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      ctx.fillText('Dept.', x + 6, y + 6);
      ctx.fillText('Created by', x + left + 6, y + 6);
      ctx.fillText('Approved by', x + middle + 6, y + 6);
      ctx.fillText('Title', x + 6, y + 42);
      ctx.fillText('Document type', x + left + 6, y + 42);
      ctx.fillText('DWG No.', x + middle + 6, y + 42);
      ctx.fillText('Rev.', x + middle + 6, y + 120);
      ctx.fillText('Date of issue', x + middle + 70, y + 120);
      ctx.fillText('Sheet', x + w - 70, y + 120);

      ctx.fillStyle = this.options.lineColor;
      ctx.font = 'bold 14px Pretendard, Arial';
      ctx.fillText(drawing.company || '주식회사 이피랑', x + left + 6, y + 18);

      ctx.font = 'bold 20px Pretendard, Arial';
      ctx.fillText(drawing.title || '실내 스마트팜 배치도', x + 8, y + 91);

      ctx.font = '13px Pretendard, Arial';
      ctx.fillText(drawing.createdBy || '-', x + left + 6, y + 54);
      ctx.fillText(drawing.approvedBy || '-', x + middle + 6, y + 18);
      ctx.fillText(drawing.drawingNo || '-', x + middle + 6, y + 88);
      ctx.fillText(drawing.revision || '-', x + middle + 6, y + 145);
      ctx.fillText(drawing.date || '-', x + middle + 70, y + 145);
      ctx.fillText(drawing.sheet || '1/1', x + w - 70, y + 145);

      ctx.restore();
    }

    drawNote() {
      const { ctx, viewport } = this;
      ctx.save();
      ctx.font = '11px Pretendard, Arial';
      ctx.fillStyle = this.options.mutedColor;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        this.layout.note || '',
        viewport.pageX + 12,
        viewport.pageY + viewport.pageHeight - 12
      );
      ctx.restore();
    }

    downloadPng(filename = 'eprang-layout.png') {
      const link = document.createElement('a');
      link.download = filename;
      link.href = this.canvas.toDataURL('image/png', 1);
      link.click();
    }

    toDataUrl(type = 'image/png', quality = 1) {
      return this.canvas.toDataURL(type, quality);
    }

    toBlob(type = 'image/png', quality = 1) {
      return new Promise((resolve, reject) => {
        this.canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas 이미지 생성에 실패했습니다.'));
        }, type, quality);
      });
    }
  }

  global.EprangLayoutCanvas = EprangLayoutCanvas;
  global.EPRANG_DEFAULT_LAYOUT = clone(DEFAULT_LAYOUT);
})(window);
