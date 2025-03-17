/**
 * ValidationRule.ts
 * 
 * Implements a validation rule for nodes.
 * Validation rules are used to validate node configurations and ensure they meet certain criteria.
 */

import { INode } from '../base/INode';

/**
 * Type definition for a validation function
 */
export type ValidationFn = (node: INode) => boolean;

/**
 * Class representing a validation rule
 */
export class ValidationRule {
  /**
   * Unique identifier for the rule
   */
  private readonly id: string;
  
  /**
   * Human-readable name of the rule
   */
  private readonly name: string;
  
  /**
   * Validation function
   */
  private readonly validationFn: ValidationFn;
  
  /**
   * Error message for when validation fails
   */
  private readonly message: string;
  
  /**
   * Creates a new ValidationRule
   * 
   * @param id Unique identifier for the rule
   * @param name Human-readable name of the rule
   * @param validationFn Validation function
   * @param message Error message for when validation fails
   */
  constructor(
    id: string,
    name: string,
    validationFn: ValidationFn,
    message: string
  ) {
    this.id = id;
    this.name = name;
    this.validationFn = validationFn;
    this.message = message;
  }
  
  /**
   * Get the unique identifier of the rule
   * 
   * @returns The rule ID
   */
  public getId(): string {
    return this.id;
  }
  
  /**
   * Get the human-readable name of the rule
   * 
   * @returns The rule name
   */
  public getName(): string {
    return this.name;
  }
  
  /**
   * Get the error message for when validation fails
   * 
   * @returns The error message
   */
  public getMessage(): string {
    return this.message;
  }
  
  /**
   * Validate a node against this rule
   * 
   * @param node The node to validate
   * @returns True if the node passes validation, false otherwise
   */
  public validate(node: INode): boolean {
    return this.validationFn(node);
  }
}

export default ValidationRule;
