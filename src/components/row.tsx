import React, { memo } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import Animated from 'react-native-reanimated';

import style from '../style';

type RowProps = {
  row: {
    data: any;
    index: number;
  };
  move: (hoverComponent: React.ReactNode, row: any) => void;
  renderItem: ({
    move,
    item,
    index,
  }: {
    move: any;
    item: any;
    index: number;
  }) => React.ReactNode;
  hidden: boolean;
  onPress: () => void;
  onDragStartCallback?: () => void;
};

const Row: React.FC<RowProps> = memo(
  ({ row, move, renderItem, hidden, onPress, onDragStartCallback }: RowProps) => {
    const onDragBegin = () => {
      if (onDragStartCallback) {
        onDragStartCallback();
      }
      const hoverComponent = renderItem({
        move,
        item: row.data,
        index: row.index,
      });
      move(hoverComponent, row);
    };

    const component = renderItem({
      move,
      item: row.data,
      index: row.index,
    });

    return (
      <TouchableWithoutFeedback
        onLongPress={onDragBegin}
        delayLongPress={300}
        onPress={onPress}>
        <Animated.View style={hidden ? style.invisible : style.visible}>
          {component}
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  },
);

export default Row;
