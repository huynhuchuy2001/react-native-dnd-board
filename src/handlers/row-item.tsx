export default class Row {
  ref: any;
  layout: { x: number; y: number; width: number; height: number } | null;
  id: string;
  index: number;
  columnId: string;
  data: any;
  hidden: boolean;

  constructor({
    ref,
    layout,
    id,
    index,
    columnId,
    data,
  }: {
    ref: any;
    layout: { x: number; y: number; width: number; height: number } | null;
    id: string;
    index: number;
    columnId: string;
    data: any;
  }) {
    this.ref = ref;
    this.layout = layout;
    this.id = id;
    this.index = index;
    this.columnId = columnId;
    this.data = data;
    this.hidden = false;
  }

  getAttributes = () => {
    return {
      ref: this.ref,
      layout: this.layout,
      id: this.id,
      index: this.index,
      columnId: this.columnId,
      data: this.data,
      hidden: this.hidden,
    };
  };

  setId = (id: string) => {
    this.id = id;
  };

  setRef = (ref: any) => {
    this.ref = ref;
  };

  setIndex = (index: number) => {
    this.index = index;
  };

  setLayout = (layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    this.layout = layout;
  };

  setData = (data: any) => {
    this.data = data;
  };

  setColumnId = (columnId: string) => {
    this.columnId = columnId;
  };

  setHidden = (hidden: boolean) => {
    this.hidden = hidden;
  };

  measureLayout = async (
    scrollOffsetX?: number,
    scrollOffsetY?: number,
  ): Promise<boolean> => {
    return new Promise(resolve => {
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
            if (scrollOffsetY) {
              py += scrollOffsetY;
            }

            const layout = { x: px, y: py, width, height };
            this.setLayout(layout);

            resolve(true);
          },
        );
      } else {
        setTimeout(() => {
          resolve(false);
        }, 300);
      }
    });
  };
}
