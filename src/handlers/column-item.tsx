export default class Column {
  ref: any;
  scrollRef: any;
  layout: any;
  id: string;
  index: number;
  data: any;
  rows: any[];

  constructor({
    ref,
    scrollRef,
    layout,
    id,
    index,
    data,
    rows,
  }: {
    ref: any;
    scrollRef: any;
    layout: any;
    id: string;
    index: number;
    data: any;
    rows: any[];
  }) {
    this.ref = ref;
    this.scrollRef = scrollRef;
    this.layout = layout;
    this.id = id;
    this.index = index;
    this.data = data;
    this.rows = rows;
  }

  getAttributes = () => {
    return {
      ref: this.ref,
      scrollRef: this.scrollRef,
      layout: this.layout,
      id: this.id,
      index: this.index,
      data: this.data,
      rows: this.rows,
    };
  };

  setRef = (ref: any) => {
    this.ref = ref;
  };

  setIndex = (index: number) => {
    this.index = index;
  };

  setLayout = (layout: any) => {
    this.layout = layout;
  };

  setScrollRef = (scrollRef: any) => {
    this.scrollRef = scrollRef;
  };

  scrollOffset = (offset: number) => {
    if (this.scrollRef) {
      this.scrollRef.scrollToOffset({ offset: offset });
    }
  };

  addRow = (row: any) => {
    row.columnId = this.id;
    row.setIndex(this.rows.length);
    this.rows.push(row);
  };

  measureRowIndex = () => {
    this.rows.forEach((row, index) => {
      row.setIndex(index);
    });
  };

  measureRowLayout = (scrollOffsetX?: number) => {
    this.rows.forEach(row => {
      if (row.measureLayout) {
        row.measureLayout(scrollOffsetX);
      }
    });
  };

  measureLayout = (scrollOffsetX?: number) => {
    if (this.ref && this.ref.measure) {
      this.ref.measure(
        (
          fx: number,
          fy: number,
          width: number,
          height: number,
          px: number,
          py: number,
        ) => {
          if (scrollOffsetX) {
            px += scrollOffsetX;
          }
          const layout = { x: px, y: py, width, height };
          this.setLayout(layout);

          this.measureRowLayout(scrollOffsetX);
        },
      );
    }
  };
}
