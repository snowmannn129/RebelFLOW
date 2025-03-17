/**
 * NodeValidator.ts
 * 
 * Implements the validator for nodes and workflows.
 * The NodeValidator is responsible for validating nodes and workflows against a set of rules.
 */

import { INode } from '../base/INode';
import { ValidationRule, ValidationFn } from './ValidationRule';
import { ConnectionManager } from '../connection/ConnectionManager';
import { NodeConnection } from '../connection/NodeConnection';

/**
 * Interface for a validation error
 */
export interface ValidationError {
  /**
   * ID of the rule that failed
   */
  ruleId: string;
  
  /**
   * Error message
   */
  message: string;
}

/**
 * Interface for a node validation result
 */
export interface NodeValidationResult {
  /**
   * Whether the node is valid
   */
  isValid: boolean;
  
  /**
   * Array of validation errors
   */
  errors: ValidationError[];
}

/**
 * Interface for a connection validation error
 */
export interface ConnectionValidationError {
  /**
   * ID of the connection that failed validation
   */
  connectionId: string;
  
  /**
   * Error message
   */
  message: string;
}

/**
 * Interface for a workflow validation result
 */
export interface WorkflowValidationResult {
  /**
   * Whether the workflow is valid
   */
  isValid: boolean;
  
  /**
   * Map of node IDs to validation errors
   */
  nodeErrors: Map<string, ValidationError[]>;
  
  /**
   * Array of connection validation errors
   */
  connectionErrors: ConnectionValidationError[];
}

/**
 * Class for validating nodes and workflows
 */
export class NodeValidator {
  /**
   * Map of validation rules by ID
   */
  private rules: Map<string, ValidationRule>;
  
  /**
   * Creates a new NodeValidator
   */
  constructor() {
    this.rules = new Map<string, ValidationRule>();
    
    // Add default rules
    this.addDefaultRules();
  }
  
  /**
   * Add default validation rules
   * 
   * @private
   */
  private addDefaultRules(): void {
    // Rule: Node must have a valid ID
    this.addRule(
      'valid-id',
      'Valid ID',
      (node) => !!node.getId() && node.getId().trim().length > 0,
      'Node must have a valid ID'
    );
    
    // Rule: Node must have a valid name
    this.addRule(
      'valid-name',
      'Valid Name',
      (node) => !!node.getName() && node.getName().trim().length > 0,
      'Node must have a valid name'
    );
  }
  
  /**
   * Add a validation rule
   * 
   * @param id Unique identifier for the rule
   * @param name Human-readable name of the rule
   * @param validationFn Validation function
   * @param message Error message for when validation fails
   * @returns The created rule
   */
  public addRule(
    id: string,
    name: string,
    validationFn: ValidationFn,
    message: string
  ): ValidationRule {
    const rule = new ValidationRule(id, name, validationFn, message);
    this.rules.set(id, rule);
    return rule;
  }
  
  /**
   * Get a validation rule by ID
   * 
   * @param id The rule ID
   * @returns The rule, or undefined if not found
   */
  public getRule(id: string): ValidationRule | undefined {
    return this.rules.get(id);
  }
  
  /**
   * Get all validation rules
   * 
   * @returns Array of all rules
   */
  public getRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }
  
  /**
   * Remove a validation rule
   * 
   * @param id The rule ID
   * @returns True if the rule was removed, false if it wasn't found
   */
  public removeRule(id: string): boolean {
    return this.rules.delete(id);
  }
  
  /**
   * Validate a node against all rules or a subset of rules
   * 
   * @param node The node to validate
   * @param ruleIds Optional array of rule IDs to validate against
   * @returns The validation result
   */
  public validateNode(node: INode, ruleIds?: string[]): NodeValidationResult {
    const errors: ValidationError[] = [];
    
    // Get the rules to validate against
    const rulesToValidate = ruleIds
      ? ruleIds.map(id => this.rules.get(id)).filter(Boolean) as ValidationRule[]
      : this.getRules();
    
    // Validate against each rule
    for (const rule of rulesToValidate) {
      if (!rule.validate(node)) {
        errors.push({
          ruleId: rule.getId(),
          message: rule.getMessage()
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate a connection
   * 
   * @param connection The connection to validate
   * @returns The validation result
   */
  public validateConnection(connection: NodeConnection): ConnectionValidationError | null {
    // Check if the connection is valid
    if (!connection.isValid()) {
      return {
        connectionId: connection.getId(),
        message: 'Connection has incompatible port types'
      };
    }
    
    return null;
  }
  
  /**
   * Validate a workflow
   * 
   * @param nodes The nodes in the workflow
   * @param connectionManager The connection manager
   * @returns The validation result
   */
  public validateWorkflow(
    nodes: INode[],
    connectionManager: ConnectionManager
  ): WorkflowValidationResult {
    const nodeErrors = new Map<string, ValidationError[]>();
    const connectionErrors: ConnectionValidationError[] = [];
    
    // Validate each node
    for (const node of nodes) {
      const result = this.validateNode(node);
      
      if (!result.isValid) {
        nodeErrors.set(node.getId(), result.errors);
      }
    }
    
    // Validate each connection
    for (const connection of connectionManager.getConnections()) {
      const error = this.validateConnection(connection);
      
      if (error) {
        connectionErrors.push(error);
      }
    }
    
    return {
      isValid: nodeErrors.size === 0 && connectionErrors.length === 0,
      nodeErrors,
      connectionErrors
    };
  }
}

export default NodeValidator;
