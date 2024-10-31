import React, { useRef, useState, useEffect } from 'react';
import {
  PanGestureHandler,
  ScrollView,
  GestureHandlerRootView,
  State,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';

import style from './style';
import Column from './components/column';
import Repository from './handlers/repository';
import Utils from './commons/utils';

const SCROLL_THRESHOLD = 50;
const SCROLL_STEP = 8;

const DraggableBoard = ({
  repository,
  renderColumnWrapper,
  renderRow,
  columnWidth,
  accessoryRight,
  activeRowStyle,
  // activeRowRotation = 8,
  xScrollThreshold = SCROLL_THRESHOLD,
  yScrollThreshold = SCROLL_THRESHOLD,
  dragSpeedFactor = 1,
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

  let absoluteX = useSharedValue(0);
  let absoluteY = useSharedValue(0);

  const scrollViewRef = useRef();
  const scrollOffset = useRef(0);
  const hoverRowItem = useRef();

  useEffect(() => {
    repository.setReload(() => setForceUpdate(prevState => !prevState));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listenRowChangeColumn = (fromColumnId, toColumnId) => {
    hoverRowItem.current.columnId = toColumnId;
    hoverRowItem.current.oldColumnId = fromColumnId;
  };

  const handleRowPosition = ([x, y]) => {
    if (hoverRowItem.current && (x || y)) {
      const columnAtPosition = repository.moveRow(
        hoverRowItem.current,
        x,
        y,
        listenRowChangeColumn,
      );

      if (columnAtPosition && scrollViewRef.current) {
        if (x + xScrollThreshold > Utils.deviceWidth) {
          scrollOffset.current += SCROLL_STEP;
          scrollViewRef.current.scrollTo({
            x: scrollOffset.current * dragSpeedFactor,
            y: 0,
            animated: true,
          });
          repository.measureColumnsLayout();
        } else if (x < xScrollThreshold) {
          scrollOffset.current -= SCROLL_STEP;
          scrollViewRef.current.scrollTo({
            x: scrollOffset.current / dragSpeedFactor,
            y: 0,
            animated: true,
          });
          repository.measureColumnsLayout();
        }
      }
    }
  };

  const onHandlerStateChange = event => {
    switch (event.nativeEvent.state) {
      case State.CANCELLED:
      case State.END:
      case State.FAILED:
      case State.UNDETERMINED:
        if (movingMode) {
          translateX.value = 0;
          translateY.value = 0;

          absoluteX.value = 0;
          absoluteY.value = 0;

          setHoverComponent(null);
          setMovingMode(false);

          if (onDragEnd) {
            onDragEnd(
              hoverRowItem.current.oldColumnId,
              hoverRowItem.current.columnId,
              hoverRowItem.current,
            );

            repository.updateOriginalData();
          }

          repository.showRow(hoverRowItem.current);
          hoverRowItem.current = null;
        }

        break;
    }
  };

  const onPanGestureEvent = useAnimatedGestureHandler({
    onStart: (event, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: event => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      absoluteX.value = event.absoluteX;
      absoluteY.value = event.absoluteY;
      runOnJS(handleRowPosition)([absoluteX.value, absoluteY.value]);
    },
    onEnd: () => {},
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
            ]}>
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

  const drag = column => {
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
          ref: ref => repository.updateColumnRef(column.id, ref),
          onLayout: () => repository.updateColumnLayout(column.id),
        },
      });
    });
  };

  return (
    <GestureHandlerRootView style={style.container}>
      <PanGestureHandler
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onHandlerStateChange}>
        <Animated.View style={[style.container, boardStyle]}>
          <ScrollView
            ref={scrollViewRef}
            scrollEnabled={!movingMode}
            horizontal={horizontal}
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={event =>
              (scrollOffset.current = event.nativeEvent.contentOffset.x)
            }
            onScrollEndDrag={() => repository.measureColumnsLayout()}
            onMomentumScrollEnd={() => repository.measureColumnsLayout()}>
            {renderColumns()}
            {Utils.isFunction(accessoryRight)
              ? accessoryRight()
              : accessoryRight}
          </ScrollView>
          {renderHoverComponent()}
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

export default DraggableBoard;
export { Repository };
