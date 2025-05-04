import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Gesture,
  GestureDetector,
  ScrollView,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";

import style from "./style";
import Column from "./components/column";
import Repository from "./handlers/repository";
import Utils from "./commons/utils";

const SCROLL_THRESHOLD = 50;
const SCROLL_STEP = 8;

const DraggableBoard = ({
  repository,
  renderColumnWrapper,
  renderRow,
  columnWidth,
  accessoryRight,
  activeRowStyle,
  xScrollThreshold = SCROLL_THRESHOLD,
  yScrollThreshold = SCROLL_THRESHOLD,
  onRowPress = () => {},
  onDragStart = () => {},
  onDragEnd = () => {},
  style: boardStyle,
  horizontal = true,
}) => {
  const [forceUpdate, setForceUpdate] = useState(false);
  const [hoverComponent, setHoverComponent] = useState(null);
  const [movingMode, setMovingMode] = useState(false);

  let translateX = useSharedValue(0);
  let translateY = useSharedValue(0);
  const boardLayout = useSharedValue({ width: 0, height: 0, x: 0, y: 0 });

  const scrollViewRef = useRef();
  const scrollOffset = useRef(0);
  const hoverRowItem = useRef();

  useEffect(() => {
    repository.setReload(() => setForceUpdate((prevState) => !prevState));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listenRowChangeColumnJS = (fromColumnId, toColumnId) => {
    hoverRowItem.current.columnId = toColumnId;
    hoverRowItem.current.oldColumnId = fromColumnId;
  };

  const handleRowPositionAndScroll = (absoluteX, absoluteY) => {
    if (!hoverRowItem.current || !movingMode) return;

    repository.moveRow(
      hoverRowItem.current,
      absoluteX,
      absoluteY,
      listenRowChangeColumnJS
    );

    if (scrollViewRef.current && boardLayout.value.width > 0) {
      const scrollTriggerWidth = xScrollThreshold;
      const currentScrollOffset = scrollOffset.value;
      const boardWidth = boardLayout.value.width;

      if (absoluteX > boardLayout.value.x + boardWidth - scrollTriggerWidth) {
        const newOffset = Math.min(
          currentScrollOffset + SCROLL_STEP,
          repository.getMaxScrollOffset()
        );
        if (newOffset > currentScrollOffset) {
          scrollOffset.value = newOffset;
          scrollViewRef.current.scrollTo({
            x: newOffset,
            y: 0,
            animated: false,
          });
          repository.measureColumnsLayout();
        }
      } else if (absoluteX < boardLayout.value.x + scrollTriggerWidth) {
        const newOffset = Math.max(0, currentScrollOffset - SCROLL_STEP);
        if (newOffset < currentScrollOffset) {
          scrollOffset.value = newOffset;
          scrollViewRef.current.scrollTo({
            x: newOffset,
            y: 0,
            animated: false,
          });
          repository.measureColumnsLayout();
        }
      }
    }
  };

  const handleDragEnd = useCallback(() => {
    if (movingMode && hoverRowItem.current) {
      const item = hoverRowItem.current;
      setHoverComponent(null);
      setMovingMode(false);

      repository.showRow(item);
      repository.updateOriginalData();

      if (onDragEnd) {
        onDragEnd(item.oldColumnId, item.columnId, item);
      }

      hoverRowItem.current = null;
    }

    translateX.value = 0;
    translateY.value = 0;
  }, [movingMode, onDragEnd, repository, translateX, translateY]);

  const panGesture = Gesture.Pan()
    .enabled()
    .onUpdate((event) => {
      "worklet";
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      const currentAbsoluteX = event.absoluteX;
      const currentAbsoluteY = event.absoluteY;

      runOnJS(handleRowPositionAndScroll)(currentAbsoluteX, currentAbsoluteY);
    })
    .onEnd(() => {
      "worklet";
      runOnJS(handleDragEnd)();
    })
    .onFinalize(() => {
      "worklet";
    });

  const animatedHoverStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const renderHoverComponent = () => {
    if (hoverComponent && hoverRowItem.current) {
      const row = repository.findRow(hoverRowItem.current);
      if (row && row.layout) {
        const { x, y, width, height } = row.layout;
        return (
          <Animated.View
            style={[
              style.hoverComponent,
              activeRowStyle,
              animatedHoverStyle,
              {
                top: y - yScrollThreshold,
                left: x,
                width,
                height,
              },
            ]}
          >
            {hoverComponent}
          </Animated.View>
        );
      }
    }
  };

  const moveItem = async (hoverItem, rowItem, isColumn = false) => {
    rowItem.setHidden(true);
    repository.hideRow(rowItem);
    await rowItem.measureLayout();
    hoverRowItem.current = { ...rowItem };

    setMovingMode(true);
    setHoverComponent(hoverItem);
  };

  const drag = (column) => {
    const hoverColumn = renderColumnWrapper({
      move: moveItem,
      item: column.data,
      index: column.index,
    });
    moveItem(hoverColumn, column, true);
  };

  const renderColumns = () => {
    const columns = repository.getColumns();
    return columns.map((column, index) => {
      const key = `${column.id}${column.name}${index}`;
      const columnComponent = (
        <Column
          repository={repository}
          column={column}
          move={moveItem}
          renderColumnWrapper={renderColumnWrapper}
          keyExtractor={(item, idx) => `${item.id}${item.name}${idx}`}
          renderRow={renderRow}
          scrollEnabled={!movingMode}
          columnWidth={columnWidth}
          onRowPress={onRowPress}
          onDragStartCallback={onDragStart}
        />
      );

      return renderColumnWrapper({
        item: column.data,
        index: column.index,
        columnComponent,
        drag: () => drag(column),
        layoutProps: {
          key,
          ref: (ref) => repository.updateColumnRef(column.id, ref),
          onLayout: () => repository.updateColumnLayout(column.id),
        },
      });
    });
  };

  return (
    <GestureHandlerRootView style={style.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[style.container, boardStyle]}>
          <ScrollView
            ref={scrollViewRef}
            scrollEnabled={!movingMode}
            horizontal={horizontal}
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(event) =>
              (scrollOffset.current = event.nativeEvent.contentOffset.x)
            }
            onScrollEndDrag={() => repository.measureColumnsLayout()}
            onMomentumScrollEnd={() => repository.measureColumnsLayout()}
          >
            {renderColumns()}
            {Utils.isFunction(accessoryRight)
              ? accessoryRight()
              : accessoryRight}
          </ScrollView>
          {renderHoverComponent()}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

export default DraggableBoard;
export { Repository };
