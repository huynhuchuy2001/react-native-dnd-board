declare module 'react-native-drag-dnd-board' {
  export class Repository {
    constructor(data: any[]);
    addRow(columnId: string, data: any): void;
    deleteRow(cardId: string): void;
    addColumn(column: any): void;
    deleteColumn(columnId: string): void;
  }

  export interface BoardProps {
    repository: Repository;
    renderRow: (props: any) => React.ReactNode;
    renderColumnWrapper: (props: any) => React.ReactNode;
    onRowPress?: (card: any) => void;
    onDragEnd?: (fromColumnId: string, toColumnId: string, card: any) => void;
    columnWidth: number;
    accessoryRight?: React.ReactNode;
    style?: any;
  }

  export default function Board(props: BoardProps): JSX.Element;
}
