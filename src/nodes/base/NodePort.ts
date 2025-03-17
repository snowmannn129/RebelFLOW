/**
 * NodePort.ts
 * 
 * Defines the port interface and implementation for node inputs and outputs.
 * Ports are the connection points between nodes that allow data to flow.
 */

/**
 * Enum representing the type of port (input or output)
 */
export enum NodePortType {
  /**
   * Input port that receives data
   */
  INPUT = 'input',
  
  /**
   * Output port that sends data
   */
  OUTPUT = 'output'
}

/**
 * Interface representing a node port
 */
export interface INodePort {
  /**
   * Unique identifier for the port
   */
  id: string;
  
  /**
   * Human-readable name of the port
   */
  name: string;
  
  /**
   * Data type of the port
   */
  type: string;
  
  /**
   * Type of port (input or output)
   */
  portType: NodePortType;
  
  /**
   * Optional description of the port
   */
  description?: string;
  
  /**
   * Default value for input ports
   */
  defaultValue?: any;
}

/**
 * Class representing a node port
 */
export class NodePort implements INodePort {
  /**
   * Unique identifier for the port
   */
  public readonly id: string;
  
  /**
   * Human-readable name of the port
   */
  public readonly name: string;
  
  /**
   * Data type of the port
   */
  public readonly type: string;
  
  /**
   * Type of port (input or output)
   */
  public readonly portType: NodePortType;
  
  /**
   * Optional description of the port
   */
  public readonly description?: string;
  
  /**
   * Default value for input ports
   */
  public readonly defaultValue?: any;
  
  /**
   * Creates a new NodePort
   * 
   * @param id Unique identifier for the port
   * @param name Human-readable name of the port
   * @param type Data type of the port
   * @param portType Type of port (input or output)
   * @param description Optional description of the port
   * @param defaultValue Default value for input ports
   */
  constructor(
    id: string,
    name: string,
    type: string,
    portType: NodePortType,
    description?: string,
    defaultValue?: any
  ) {
    this.id = id;
    this.name = name || id;
    this.type = type;
    this.portType = portType;
    this.description = description;
    this.defaultValue = defaultValue;
  }
  
  /**
   * Creates an input port
   * 
   * @param id Unique identifier for the port
   * @param type Data type of the port
   * @param description Optional description of the port
   * @param defaultValue Default value for the port
   * @returns A new input port
   */
  public static createInput(
    id: string,
    type: string,
    description?: string,
    defaultValue?: any
  ): NodePort {
    return new NodePort(
      id,
      id,
      type,
      NodePortType.INPUT,
      description,
      defaultValue
    );
  }
  
  /**
   * Creates an output port
   * 
   * @param id Unique identifier for the port
   * @param type Data type of the port
   * @param description Optional description of the port
   * @returns A new output port
   */
  public static createOutput(
    id: string,
    type: string,
    description?: string
  ): NodePort {
    return new NodePort(
      id,
      id,
      type,
      NodePortType.OUTPUT,
      description
    );
  }
  
  /**
   * Checks if the port is an input port
   * 
   * @returns True if the port is an input port, false otherwise
   */
  public isInput(): boolean {
    return this.portType === NodePortType.INPUT;
  }
  
  /**
   * Checks if the port is an output port
   * 
   * @returns True if the port is an output port, false otherwise
   */
  public isOutput(): boolean {
    return this.portType === NodePortType.OUTPUT;
  }
  
  /**
   * Checks if the port is compatible with another port for connection
   * 
   * @param otherPort The other port to check compatibility with
   * @returns True if the ports are compatible, false otherwise
   */
  public isCompatibleWith(otherPort: NodePort): boolean {
    // Input can connect to output and vice versa
    if (this.portType === otherPort.portType) {
      return false;
    }
    
    // Types must match
    return this.type === otherPort.type;
  }
}

export default NodePort;
