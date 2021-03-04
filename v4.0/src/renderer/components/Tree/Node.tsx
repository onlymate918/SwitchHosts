/**
 * Node
 * @author: oldj
 * @homepage: https://oldj.net
 */

import clsx from 'clsx'
import React, { useRef } from 'react'
import { isChildOf } from './fn'
import styles from './style.less'
import { DropWhereType, NodeIdType } from './Tree'

export type NodeUpdate = (data: Partial<ITreeNodeData>) => void

export interface ITreeNodeData {
  id: NodeIdType;
  title?: string;
  children?: ITreeNodeData[];
  can_select?: boolean; // 是否可以被选中，默认为 true
  can_drag?: boolean; // 是否可以拖动，默认为 true
  can_drop_before?: boolean; // 是否可以接受 drop before，默认为 true
  can_drop_in?: boolean; // 是否可以接受 drop in，默认为 true
  can_drop_after?: boolean; // 是否可以接受 drop after，默认为 true
  is_collapsed?: boolean;

  [key: string]: any;
}

interface INodeProps {
  tree: ITreeNodeData[];
  data: ITreeNodeData;
  nodeClassName?: string;
  nodeSelectedClassName?: string;
  nodeCollapseArrowClassName?: string;
  drag_source_id?: NodeIdType | null;
  drop_target_id?: NodeIdType | null;
  drag_target_where?: DropWhereType | null;
  onDragStart: (id: NodeIdType) => void;
  onDragEnd: () => void;
  setDropTargetId: (id: NodeIdType | null) => void;
  setDropWhere: (where: DropWhereType | null) => void;
  selected_id: NodeIdType | null;
  onSelect: (id: NodeIdType) => void;
  level: number;
  is_dragging: boolean;
  render?: (data: ITreeNodeData, update: NodeUpdate) => React.ReactElement;
  draggingNodeRender?: (data: ITreeNodeData) => React.ReactElement;
  collapseArrow?: string | React.ReactElement;
  onChange: (id: NodeIdType, data: Partial<ITreeNodeData>) => void;
  indent_px?: number;
  nodeAttr?: (node: ITreeNodeData) => Partial<ITreeNodeData>;
}

const Node = (props: INodeProps) => {
  const {
    data,
    setDropTargetId,
    setDropWhere,
    drag_source_id,
    drop_target_id,
    drag_target_where,
    level,
    is_dragging,
    render,
    draggingNodeRender,
    indent_px,
    selected_id,
    onSelect,
    onChange,
    nodeAttr,
    nodeClassName,
    nodeSelectedClassName,
    nodeCollapseArrowClassName,
  } = props

  const el_node = useRef<HTMLDivElement>(null)
  const el_dragging = useRef<HTMLDivElement>(null)

  const getTargetId = (el: HTMLElement | null): string | undefined => {
    if (!el) return
    let id = el.getAttribute('data-id')
    return id || getTargetId(el.parentNode as HTMLElement)
  }

  const makeDraggingElement = (ne: DragEvent) => {
    let el = el_dragging.current
    if (!el) return

    el.style.display = 'block'
    ne.dataTransfer?.setDragImage(el, -4, -4)
  }

  const onDragStart = (e: React.DragEvent) => {
    let ne = e.nativeEvent
    if (ne.dataTransfer) {
      ne.dataTransfer.dropEffect = 'move'
      ne.dataTransfer.effectAllowed = 'move'
      // ne.dataTransfer.setData('text', data.id)
      // makeDraggingElement(ne)

      if (draggingNodeRender) {
        makeDraggingElement(ne)
      }
    }

    props.onDragStart(data.id)
  }

  // const onDragEnter = (e: React.DragEvent) => {
  // }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!is_dragging || !drag_source_id) return

    let el_target = e.target as HTMLElement
    if (!el_target) return

    if (data.id === drag_source_id) return
    if (isChildOf(props.tree, data.id, drag_source_id)) return

    setDropTargetId(data.id)

    let attr = nodeAttr ? nodeAttr(data) : data

    // where
    let ne = e.nativeEvent
    let h = el_target.offsetHeight
    let y = ne.offsetY
    let where: DropWhereType
    let h_4 = h >> 2
    if (y <= h_4) {
      if (attr.can_drop_before === false) return
      where = 'before'
    } else if (y >= h - h_4) {
      if (attr.can_drop_after === false) return
      where = 'after'
    } else {
      if (attr.can_drop_in === false) return
      where = 'in'
    }
    setDropWhere(where)
  }

  // const onDragLeave = (e: React.DragEvent) => {
  // }

  const onDragEnd = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // console.log('onDragEnd.')
    props.onDragEnd()

    el_dragging.current && (el_dragging.current.style.display = 'none')
  }

  const onUpdate = (kv: Partial<ITreeNodeData>) => {
    onChange(data.id, kv)
  }

  const is_drag_source = drag_source_id === data.id
  const is_drop_target = drop_target_id === data.id
  const is_selected = selected_id === data.id
  const is_parent_is_drag_source = drag_source_id ? isChildOf(props.tree, data.id, drag_source_id) : false
  const has_children = Array.isArray(data.children) && data.children.length > 0

  return (
    <>
      <div
        ref={el_node}
        className={clsx(
          styles.node,
          is_dragging && styles.is_dragging,
          (is_drag_source || is_parent_is_drag_source) && styles.is_source,
          is_drop_target && styles[`drop_${drag_target_where}`],
          is_selected && (nodeSelectedClassName || styles.selected),
          nodeClassName,
        )}
        data-id={data.id}
        draggable={data.can_drag !== false}
        onDragStart={onDragStart}
        // onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        // onDragLeave={onDragLeave}
        onDragEnd={onDragEnd}
        onDrop={onDragEnd}
        onClick={() => data.can_select !== false && onSelect(data.id)}
        style={{
          paddingLeft: level * (indent_px || 20),
        }}
      >
        <div className={styles.content}>
          <div className={styles.ln_header}>{
            has_children ?
              <div
                className={clsx(
                  styles.arrow,
                  nodeCollapseArrowClassName,
                  data.is_collapsed && styles.collapsed,
                )}
                data-collapsed={!!data.is_collapsed}
                onClick={() => {
                  props.onChange(data.id, { is_collapsed: !data.is_collapsed })
                }}
              >
                {props.collapseArrow ? props.collapseArrow : '>'}
              </div> :
              null
          }</div>
          <div className={styles.ln_body}>
            {
              render ? render(data, onUpdate) : (data.title || `node#${data.id}`)
            }
          </div>
        </div>
      </div>
      {draggingNodeRender && (
        <div ref={el_dragging} className={styles.for_dragging}>
          {draggingNodeRender(data)}
        </div>
      )}
      {has_children && data.children && !data.is_collapsed
        ? data.children.map((node) => (
          <Node {...props} key={node.id} data={node} level={level + 1}/>
        ))
        : null}
    </>
  )
}

export default Node
