(function () {
  'use strict';

  function safeNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function buildEprangLayoutFromSurvey(survey, reco) {
    const step1 = survey?.step1 || {};
    const step2 = survey?.step2 || {};

    const floorAreaSqm = safeNumber(
      step2.usable_area || step2.floor_area,
      165
    );

    const ceilingHeight = safeNumber(step2.ceil_height, 4.5);

    /*
     * 면적을 직사각형 공간으로 환산합니다.
     * 50~60평 규모는 약 12m × 14~16m 전후로 구성됩니다.
     */
    let roomWidthMm;

    if (floorAreaSqm >= 260) {
      roomWidthMm = 16000;
    } else if (floorAreaSqm >= 190) {
      roomWidthMm = 14000;
    } else if (floorAreaSqm >= 120) {
      roomWidthMm = 12000;
    } else {
      roomWidthMm = 9000;
    }

    const roomHeightMm = Math.max(
      6000,
      Math.round((floorAreaSqm * 1000000) / roomWidthMm)
    );

    const highCeiling = ceilingHeight >= 5;
    const rackColumns =
      floorAreaSqm >= 190 ? 8 :
      floorAreaSqm >= 120 ? 6 : 4;

    const rackLevels =
      highCeiling ? 5 :
      ceilingHeight >= 4 ? 4 : 3;

    const drawingCode =
      reco?.code ||
      reco?.id ||
      String(Date.now());

    return {
      drawing: {
        title: `${reco?.title || '실내 스마트팜'} 배치도`,
        drawingNo: `EPRANG-${String(drawingCode).toUpperCase()}`,
        company: '주식회사 이피랑',
        createdBy: '이피랑 AI 설계',
        approvedBy: '',
        date: new Date().toISOString().slice(0, 10),
        revision: 'A',
        sheet: '1/1'
      },

      source: {
        region: step1.region_si || '',
        facility: step2.facility || '',
        floorAreaSqm,
        ceilingHeight,
        recommendationCode: reco?.code || null,
        recommendationTitle: reco?.title || null
      },

      room: {
        widthMm: roomWidthMm,
        heightMm: roomHeightMm,
        wallThicknessMm: 120
      },

      racks: [
        {
          id: 'rack-a',
          xMm: Math.round(roomWidthMm * 0.15),
          yMm: Math.round(roomHeightMm * 0.14),
          widthMm: Math.round(roomWidthMm * 0.66),
          heightMm: Math.round(roomHeightMm * 0.38),
          columns: rackColumns,
          rows: highCeiling ? 5 : 4,
          levels: rackLevels,
          label: '재배랙 A'
        },
        {
          id: 'rack-b',
          xMm: Math.round(roomWidthMm * 0.32),
          yMm: Math.round(roomHeightMm * 0.58),
          widthMm: Math.round(roomWidthMm * 0.49),
          heightMm: Math.round(roomHeightMm * 0.26),
          columns: Math.max(4, rackColumns - 2),
          rows: 4,
          levels: rackLevels,
          label: '재배랙 B'
        }
      ],

      equipment: [
        {
          id: 'ac-1',
          type: 'aircon',
          xMm: Math.round(roomWidthMm * 0.10),
          yMm: 250,
          widthMm: 650,
          heightMm: 300,
          label: '에어컨'
        },
        {
          id: 'ac-2',
          type: 'aircon',
          xMm: Math.round(roomWidthMm * 0.82),
          yMm: 250,
          widthMm: 650,
          heightMm: 300,
          label: '에어컨'
        },
        {
          id: 'fan-1',
          type: 'fan',
          xMm: Math.round(roomWidthMm * 0.18),
          yMm: Math.round(roomHeightMm * 0.83),
          radiusMm: 430,
          label: '순환팬'
        },
        {
          id: 'tank-1',
          type: 'tank',
          xMm: Math.round(roomWidthMm * 0.045),
          yMm: Math.round(roomHeightMm * 0.45),
          widthMm: 420,
          heightMm: 620,
          label: '양액탱크'
        }
      ],

      doors: [
        {
          id: 'door-1',
          wall: 'bottom',
          offsetMm: Math.round(roomWidthMm * 0.08),
          widthMm: 1100,
          swing: 'right'
        }
      ],

      dimensions: [
        {
          from: [
            Math.round(roomWidthMm * 0.15),
            Math.round(roomHeightMm * 0.55)
          ],
          to: [0, Math.round(roomHeightMm * 0.55)],
          label: String(Math.round(roomWidthMm * 0.15))
        },
        {
          from: [
            Math.round(roomWidthMm * 0.81),
            Math.round(roomHeightMm * 0.32)
          ],
          to: [roomWidthMm, Math.round(roomHeightMm * 0.32)],
          label: String(Math.round(roomWidthMm * 0.19))
        },
        {
          from: [
            Math.round(roomWidthMm * 0.55),
            Math.round(roomHeightMm * 0.14)
          ],
          to: [Math.round(roomWidthMm * 0.55), 0],
          label: String(Math.round(roomHeightMm * 0.14))
        }
      ],

      note:
        '본 도면은 AI 기반 기본 배치 초안이며, 현장 실측 및 전문 설계 검토 후 최종 확정됩니다.'
    };
  }

  /*
   * reco-intro.html과 reco-intro_new.html의 기존 코드를 건드리지 않아도
   * ep-temp-project-package 저장 시 layout을 자동으로 추가합니다.
   */
  const originalSetItem = Storage.prototype.setItem;

  Storage.prototype.setItem = function (key, value) {
    if (key === 'ep-temp-project-package') {
      try {
        const packageData = JSON.parse(value);

        if (
          packageData &&
          packageData.survey &&
          packageData.reco &&
          !packageData.layout
        ) {
          packageData.layout = buildEprangLayoutFromSurvey(
            packageData.survey,
            packageData.reco
          );

          value = JSON.stringify(packageData);
        }
      } catch (error) {
        console.error('이피랑 도면 패키지 생성 실패:', error);
      }
    }

    return originalSetItem.call(this, key, value);
  };

  window.buildEprangLayoutFromSurvey = buildEprangLayoutFromSurvey;
})();
