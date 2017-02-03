
export function oVirtTabFactory (React) {
  return React.createClass({
    render: function () {
      const params = this.props.params;
      return (
        <div>
          <h1>Hello {params.vm.name}!</h1>
          TODO: add oVirt specific content
        </div>
      );
    }
  });
}
