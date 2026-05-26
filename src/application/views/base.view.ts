
export interface View {
  /**
   * render the view with the given data
   * 
   * @param data the data to render the view
   */
  render(data: Record<string, any> | undefined): string;

  /**
   * logic to apply after render the view
   */
  afterRender(): void;
}