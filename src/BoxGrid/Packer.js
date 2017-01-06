// @flow
type ColConfigType = {
  colCount: number,
  itemWidth: number,
};

type ColumnsType = Array<Array<{
  startX: number,
  startY: number,
  endY: ?number
}>>;

type AvailableSlotType = Array<Array<number>>;

export default class BoxPacker {
  colConfig: ColConfigType;
  columns: ColumnsType;

  init(colConfig: ColConfigType) {
    this.colConfig = colConfig;

    this.columns = [];
    for (let i = 0; i < this.colConfig.colCount; i += 1) {
      this.columns[i] = this.columns[i] || [];
      this.columns[i].push({
        startX: this.colConfig.itemWidth * i,
        startY: 0,
        endY: null,
      });
    }
  }

  /**
   * Splits all given slots after an item has been inserted into it.
   */
  splitAllSlots(usedSlots: AvailableSlotType, insertedItemHeight: number) {
    for (let i = 0; i < usedSlots.length; i += 1) {
      const [slotColIdx, slotItemIdx, slotItemOffset] = usedSlots[i];

      const thisSlot = this.columns[slotColIdx][slotItemIdx];

      const currSlotEndY = thisSlot.endY;

      const newSlotEndY = thisSlot.startY + insertedItemHeight + slotItemOffset + 1;

      const itemsToInsert = [];

      // Prepend an item when we have an offset.
      if (slotItemOffset > 0) {
        itemsToInsert.push({
          startX: thisSlot.startX,
          startY: thisSlot.startY,
          endY: thisSlot.startY + slotItemOffset,
        });
      }

      // Populate the nextSlot after this item if there's still room.
      if (currSlotEndY == null || currSlotEndY > newSlotEndY) {
        itemsToInsert.push({
          startX: thisSlot.startX,
          startY: newSlotEndY,
          endY: currSlotEndY,
        });
      }

      // Remove the current slot and insert with new slots.
      this.columns[slotColIdx].splice(slotItemIdx, 1, ...itemsToInsert);
    }
  }

  findNextShortest(searchFromHeight: number): Array<Array<number>> {
    let currLowestItem = null;
    let lowestItems = [];

    for (let i = 0; i < this.columns.length; i += 1) {
      for (let j = 0; j < this.columns[i].length; j += 1) {
        const currItem = this.columns[i][j];
        if (currItem.startY > searchFromHeight &&
          (lowestItems.length === 0 ||
            (currLowestItem != null && currItem.startY <= currLowestItem.startY)
          )) {
          if (!currLowestItem || currItem.startY < currLowestItem.startY) {
            currLowestItem = currItem;
            lowestItems = [];
          }
          lowestItems.push([i, j]);
        }
      }
    }
    return lowestItems;
  }

  columnHasSlotAt(colIdx: number, startFrom: number, requiredHeight: number) {
    for (let i = 0; i < this.columns[colIdx].length; i += 1) {
      const item = this.columns[colIdx][i];
      if (item.startY <= startFrom &&
        (item.endY == null || item.endY >= startFrom + requiredHeight)) {
        return i;
      }
    }
    return null;
  }

  findAvailableSlots(columnIdx: number, itemIdx: number, colSpan: number, itemHeight: number,
    itemSlotOffset: number = 0): AvailableSlotType {
    const item = this.columns[columnIdx][itemIdx];
    const availableSlots = [];

    // Item is too wide for the current column.
    if (columnIdx + colSpan > this.columns.length) {
      return availableSlots;
    }

    for (let i = columnIdx; i < columnIdx + colSpan; i += 1) {
      const itemSlotIdx = this.columnHasSlotAt(i, item.startY + itemSlotOffset, itemHeight);
      if (itemSlotIdx !== null) {
        const nextItem = this.columns[i][itemSlotIdx];
        availableSlots.push([i, itemSlotIdx, (item.startY + itemSlotOffset) - nextItem.startY]);
      }
    }
    return availableSlots;
  }

  position(width: number, height: number, colSpan: number) {
    // Find the lowest point where this item will fit.
    let searchFromHeight = -1;
    let usedSlots = [];
    /* eslint no-constant-condition:0 */
    /* eslint no-labels:0 */
    /* eslint no-restricted-syntax:0 */
    slotSearch:
    while (true) {
      let itemSlotOffset = 0;
      let lowestItems = this.findNextShortest(searchFromHeight);

      // If we can't find the item, just stick it in the bottom left for now.
      if (lowestItems.length === 0) {
        let tallestItem = 0;
        for (let i = 1; i < colSpan; i += 1) {
          const column = this.columns[i];
          const lastItem = column[column.length - 1];
          if (lastItem.startY > tallestItem) {
            tallestItem = lastItem.startY;
          }
        }

        // TODO: Set offset to the tallest and continue.
        const columnIdx = 0;
        const itemIdx = this.columns[0].length - 1;
        lowestItems = [
          [columnIdx, itemIdx],
        ];
        itemSlotOffset = tallestItem - this.columns[columnIdx][itemIdx].startY;
      }

      for (let i = 0; i < lowestItems.length; i += 1) {
        const [colIdx, itemIdx] = lowestItems[i];
        usedSlots = this.findAvailableSlots(colIdx, itemIdx, colSpan, height, itemSlotOffset);
        if (usedSlots.length > 0 && usedSlots.length >= colSpan) {
          break slotSearch;
        }
      }

      // We start the next search from the any of the lowest items
      // since they should all have the same start.
      searchFromHeight = this.columns[lowestItems[0][0]][lowestItems[0][1]].startY;
    }

    // The item is positioned at the top left of the first slot.
    const [slotColIdx, slotItemIdx, slotHeightOffset] = usedSlots[0];
    const firstSlot = this.columns[slotColIdx][slotItemIdx];

    // Split all slots horizontally based on item height.
    this.splitAllSlots(usedSlots, height);

    return {
      top: firstSlot.startY + slotHeightOffset,
      left: firstSlot.startX,
    };
  }
}
