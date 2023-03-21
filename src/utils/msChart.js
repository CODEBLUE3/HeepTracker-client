import Circle from "./circle";

const X_PADDING = 25;
const Y_PADDING = 50;
const TOP_PADDING = 15;
const VIEW_NODE_COUNT = 13;
const Y_TICK_COUNT = 7;
const NODE_RADIUS = 5;

export default class LineChart {
  constructor(id, data, durationTime) {
    this.data = [...data];
    this.canvas = document.getElementById(id);
    this.ctx = this.canvas.getContext("2d");

    this.canvasWidth = this.canvas.clientWidth;
    this.canvasHeight = this.canvas.clientHeight;
    this.chartWidth = this.canvasWidth - Y_PADDING;
    this.chartHeight = this.canvasHeight - X_PADDING - TOP_PADDING;

    this.chartDurationTime = durationTime;
    this.excuteDurationTime = 0;
    this.intervalID = 0;
    this.currentPosition = 0;

    this.maxMemoryText = 0;
    this.minMemoryText = Infinity;
    this.maxMemoryValue = 0;
    this.minMemoryValue = Infinity;
    this.maxTimeValue = 0;
    this.minTimeValue = Infinity;
    this.heightPixelWeights = 0;
    this.widthPixelWeights = 0;

    this.circle = [];
    this.snapshotCircle = [];

    this.canvas.addEventListener("mousemove", (e) => {
      const cursorPositionX = e.clientX - this.ctx.canvas.offsetLeft;
      const cursorPositionY = e.clientY - this.ctx.canvas.offsetTop;

      if (this.snapshotCircle.length > 0) {
        this.snapshotCircle.forEach((item) => {
          if (item.isMouseOver(cursorPositionX, cursorPositionY)) {
            item.reDraw();
          }
        });
      }
    });

    this.parseMemoryArray();
    return this;
  }

  playback = () => {
    if (this.intervalID < 1) {
      this.intervalID = setInterval(() => {
        this.updateData();
      }, this.chartDurationTime / this.excuteDurationTime);
    }
  };

  pause = () => {
    this.circle.every((item) => item.draw());
    clearInterval(this.intervalID);
    this.intervalID = 0;
  };

  stop = () => {
    clearInterval(this.intervalID);
    this.intervalID = 0;
    this.currentPosition = 0;
  };

  setTime = () => {
    this.startTime = this.data[0].timeStamp;
    this.intervalID = setInterval(() => {
      this.updateData();
    }, this.chartDurationTime / this.excuteDurationTime);
  };

  parseMemoryArray = () => {
    if (this.data.length) {
      this.data.forEach((item) => {
        this.minMemoryText = Math.min(this.minMemoryText, item.usedMemory);
        this.maxMemoryText = Math.max(this.maxMemoryText, item.usedMemory);
      });

      this.excuteDurationTime = this.data.length;

      this.data.forEach((item) => {
        this.minMemoryValue = Math.min(this.minMemoryValue, item.usedMemory);
        this.maxMemoryValue = Math.max(this.maxMemoryValue, item.usedMemory);
      });

      this.heightPixelWeights =
        (this.chartHeight - Y_PADDING) /
        (this.maxMemoryValue - this.minMemoryValue);
    }
  };

  drawChart = () => {
    const { ctx, canvasWidth, canvasHeight, chartHeight, chartWidth } = this;
    const xDistance =
      this.data[this.data.length - 1].timeStamp / this.data.length;
    const baseMemory = this.data[0].usedMemory;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    ctx.beginPath();
    ctx.moveTo(Y_PADDING, TOP_PADDING);

    ctx.lineTo(Y_PADDING, chartHeight + TOP_PADDING);
    const yInterval =
      (this.maxMemoryText - this.minMemoryText) / (Y_TICK_COUNT - 1);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i < Y_TICK_COUNT; i++) {
      const value = Math.floor(i * yInterval + this.minMemoryText);
      const yPoint =
        TOP_PADDING + chartHeight - i * (chartHeight / Y_TICK_COUNT);
      ctx.fillText(value, Y_PADDING - 3, yPoint);
    }

    ctx.lineTo(canvasWidth, chartHeight + TOP_PADDING);
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.rect(Y_PADDING, 0, chartWidth, canvasHeight);
    ctx.clip();

    ctx.beginPath();

    // 동적으로 움직이는 차트내 한 장면의 노드 갯수를 filter하고
    // map으로 Circle객체를 생성하고 저장하였습니다.
    this.snapshotCircle = this.data
      .filter(
        (item) =>
          item.timeStamp > xDistance * this.currentPosition &&
          item.timeStamp < xDistance * (this.currentPosition + VIEW_NODE_COUNT),
      )
      .map((item) => {
        const offset = 25;
        const xPosition =
          (this.chartWidth / (xDistance * VIEW_NODE_COUNT)) * item.timeStamp -
          (this.chartWidth / VIEW_NODE_COUNT) * this.currentPosition +
          offset;
        const yPosition =
          TOP_PADDING +
          this.chartHeight -
          this.heightPixelWeights * (item.usedMemory - baseMemory);

        return new Circle(xPosition, yPosition, NODE_RADIUS, ctx, item);
      });

    // 동적으로 움직이는 한 장면에 노드를 표현하였습니다.
    // FIXME: 노드가 x축과 겹치는 현상 해결 필요.
    this.snapshotCircle.forEach((item) => {
      item.draw();
    });

    // x축 좌표 ns 표현
    for (let index = 0; index < VIEW_NODE_COUNT; index += 1) {
      const xPosition = (this.chartWidth / VIEW_NODE_COUNT) * (index + 1);

      ctx.fillStyle = "black";
      ctx.fillText(
        Math.floor(
          (xDistance * this.currentPosition + xDistance * index) / 1000,
        ),
        xPosition,
        chartHeight + TOP_PADDING + 10,
      );
    }

    // FIXME: Circle method인 reDraw()로 인한 색변경 오류 발견. 해결 필요
    ctx.stroke();
    ctx.restore();
  };

  updateData = () => {
    if (!this.data.length) {
      return;
    }

    this.circle.length = 0;
    this.drawChart();
    this.currentPosition += 1;

    if (this.currentPosition - VIEW_NODE_COUNT / 2 > this.data.length) {
      clearInterval(this.intervalID);
      this.intervalID = 0;
      this.currentPosition = 0;
    }
  };
}
