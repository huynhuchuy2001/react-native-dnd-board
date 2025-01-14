import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import style from '../style';
import Row from './row';

interface ColumnProps {
  repository: {
    updateRowRef: (columnId: string, rowId: string, ref: any) => void;
    updateRowLayout: (columnId: string, rowId: string) => void;
    getRowsByColumnId: (columnId: string) => any[];
    addListener: (
      columnId: string,
      event: string,
      callback: () => void,
    ) => void;
    setColumnScrollRef: (columnId: string, ref: any) => void;
  };
  move: any;
  column: {
    id: string;
    rows: any[];
    measureRowLayout: () => void;
  };
  keyExtractor: (item: any, index: number) => string;
  renderRow: (item: any) => React.ReactElement;
  scrollEnabled: boolean;
  columnWidth: number;
  onDragStartCallback?: () => void;
  onRowPress?: (item: any) => void;
}

const Column: React.FC<ColumnProps> = ({
  repository,
  move,
  column,
  keyExtractor,
  renderRow,
  scrollEnabled,
  columnWidth,
  onDragStartCallback,
  onRowPress = () => {},
}: ColumnProps) => {
  const [rows, setRows] = useState<any[]>(column.rows);

  const verticalOffset = useRef<number>(0);
  const columnRef = useRef<any>(null);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      verticalOffset.current = event.nativeEvent.contentOffset.x;
    },
    [],
  );

  const onScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      verticalOffset.current = event.nativeEvent.contentOffset.x;
      column.measureRowLayout();
    },
    [column],
  );

  const renderRowItem = ({ item, index }: { item: any; index: number }) => {
    return (
      <View
        ref={(ref: any) => repository.updateRowRef(column.id, item.id, ref)}
        onLayout={(layout: any) => repository.updateRowLayout(column.id, item.id)}>
        <Row
          row={item}
          move={move}
          renderItem={renderRow}
          hidden={item.hidden}
          onPress={() => onRowPress(item)}
          onDragStartCallback={onDragStartCallback}
        />
      </View>
    );
  };

  const reload = () => {
    const items = repository.getRowsByColumnId(column.id);
    setRows([...items]);
  };

  useEffect(() => {
    repository.addListener(column.id, 'reload', reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRows(column.rows);
  }, [column.id, column.rows, column.rows.length, repository]);

  const setRef = (ref: any) => {
    columnRef.current = ref;
    repository.setColumnScrollRef(column.id, columnRef.current);
  };

  return (
    <View style={[style.container, { minWidth: columnWidth }]}>
      <FlatList
        ref={setRef}
        data={rows}
        extraData={[rows, rows.length, column.rows]}
        renderItem={renderRowItem}
        keyExtractor={keyExtractor}
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        onScroll={onScroll}
        onScrollEndDrag={onScrollEnd}
        onMomentumScrollEnd={onScrollEnd}
      />
    </View>
  );
};

export default Column;
