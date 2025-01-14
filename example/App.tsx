import React, {useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import Board, {Repository} from 'react-native-drag-dnd-board';

interface Row {
  id: string;
  name: string;
}

interface Column {
  id: string;
  name: string;
  rows: Row[];
}

const mockData: Column[] = [
  {
    id: '1',
    name: 'Column 1',
    rows: [
      {id: '11', name: 'Row 1 (Column 1)'},
      {id: '12', name: 'Row 2 (Column 1)'},
      {id: '13', name: 'Row 3 (Column 1)'},
      {id: '14', name: 'Row 4 (Column 1)'},
    ],
  },
  {
    id: '2',
    name: 'Column 2',
    rows: [
      {id: '21', name: 'Row 1 (Column 2)'},
      {id: '22', name: 'Row 2 (Column 2)'},
      {id: '23', name: 'Row 3 (Column 2)'},
    ],
  },
  {
    id: '3',
    name: 'Column 3',
    rows: [
      {id: '31', name: 'Row 1 (Column 3)'},
      {id: '32', name: 'Row 2 (Column 3)'},
    ],
  },
];

let mockDataLength = mockData.length;
let mockDataRowLength: Record<string, number> = {};
mockData.forEach(column => {
  mockDataRowLength[column.id] = column.rows.length;
});

const COLUMN_WIDTH = Dimensions.get('window').width * 0.6;

const App: React.FC = () => {
  const [repository] = useState(new Repository(mockData));

  const addCard = (columnId: string) => {
    const data: Row = {
      id: `${columnId}${++mockDataRowLength[columnId]}`,
      name: `Row ${mockDataRowLength[columnId]} (Column ${columnId})`,
    };

    repository.addRow(columnId, data);
  };

  const deleteCard = (cardId: string) => {
    repository.deleteRow(cardId);
  };

  const renderCard = ({item}: {item: Row}) => (
    <View style={styles.card}>
      <Text>{item.name}</Text>
      <TouchableOpacity
        hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
        onPress={() => deleteCard(item.id)}>
        <Text>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const addColumn = () => {
    mockDataRowLength[++mockDataLength] = 0;
    const column: Column = {
      id: mockDataLength.toString(),
      name: `Column ${mockDataLength}`,
      rows: [],
    };

    mockData.push(column);
    repository.addColumn(column);
  };

  const deleteColumn = (columnId: string) => {
    const columnIndex = mockData.findIndex(column => column.id === columnId);
    if (columnIndex > -1) {
      mockData.splice(columnIndex, 1);
    }

    repository.deleteColumn(columnId);
  };

  const renderColumn = ({
    item,
    columnComponent,
    layoutProps,
  }: {
    item: Column;
    columnComponent: React.ReactNode;
    layoutProps: any;
  }) => (
    <View style={styles.column} {...layoutProps}>
      <View style={styles.columnHeader}>
        <Text style={styles.columnName}>{item.name}</Text>
        <TouchableOpacity
          hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
          onPress={() => deleteColumn(item.id)}>
          <Text>✕</Text>
        </TouchableOpacity>
      </View>
      {columnComponent}
      <TouchableOpacity style={styles.addCard} onPress={() => addCard(item.id)}>
        <Text>+ Add Card</Text>
      </TouchableOpacity>
    </View>
  );

  const onCardPress = (card: Row) => {
    console.log('Card ID: ', card.id);
  };

  const onDragEnd = (fromColumnId: string, toColumnId: string, card: Row) => {
    // Handle drag end
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#014A81" />
      <View style={styles.header}>
        <Text style={styles.headerName}>React Native DnD Board</Text>
      </View>

      <Board
        style={styles.board}
        repository={repository}
        renderRow={renderCard}
        renderColumnWrapper={renderColumn}
        onRowPress={onCardPress}
        onDragEnd={onDragEnd}
        columnWidth={COLUMN_WIDTH}
        accessoryRight={
          <View style={[styles.column, styles.addColumn]}>
            <TouchableOpacity onPress={addColumn}>
              <Text>+ Add Column</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  board: {
    paddingVertical: 16,
    backgroundColor: '#E0E8EF',
  },
  column: {
    backgroundColor: '#F8FAFB',
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 4,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  columnName: {
    fontWeight: 'bold',
  },
  addColumn: {
    marginRight: 12,
    padding: 12,
    minWidth: COLUMN_WIDTH,
  },
  card: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F6F7FB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addCard: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(233, 233, 233)',
    borderRadius: 4,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F5F6F8',
  },
});

export default App;
