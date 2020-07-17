import {
    Component,
    ComponentInterface,
    Element,
    Host,
    h,
    Prop,
    Watch,
    State,
    Event,
    EventEmitter,
    Method
} from '@stencil/core';

import { ElementMetadata } from './elementMetadata';
import { CommandStore } from './commandStore';

@Component({
    tag: 'stencil-component',
    styleUrl: 'stencil-component.css',
    shadow: true,
})
export class StencilComponent implements ComponentInterface {

    @State() // internal state [1] update internally [2] NO outside update [3] update WILL CAUSE RE-RENDER
    private _name = 'World';
    @State() // docs: https://stenciljs.com/docs/state
    private _count = 0;

    private _commandStore: CommandStore | undefined; // Need/should not re-render
    private _nameTextInput!: HTMLInputElement; // JSX can have direct reference to elements
    private _amountTextInput!: HTMLInputElement;
    // private _hostElement!: HTMLElement; // to capture the host / component element

    @Element() // get host element ref
    private _hostElement!: HTMLElement; // to automatically capture the host / component element

    // Prop by default [1] create an ATTRIBUTE [2] immutable from inside [3] listens for change
    @Prop({mutable: true})
    collapsed = false;

    // docs: https://stenciljs.com/docs/properties reflect: true to reflect Prop value in attr
    @Prop({mutable: true, reflect: true})
    metadata: string;
    @Watch('metadata') // watch ONLY CHECKS REFERENCE, internal property changes are NOT watched..!!!
    validateMetadata(newValue: string, oldValue: string) {
        if (newValue) {
            const parsedMetadata = typeof newValue === 'string'
                ? JSON.parse(newValue)
                : newValue;
            if (parsedMetadata) {
                this._count = parsedMetadata.count;
                this._name = parsedMetadata.name;
            } else {
                this.metadata = oldValue;
                console.error(`Invalid metadata value!`);
                console.error(newValue);
            }
        }
    }

    // @Prop({  }) // client needs to set this
    @Method()
    public async setCommandStore(value: CommandStore) { // won't create attribute since type is NOT primitive
        this._commandStore = value;
    }

    // @Prop() // a ead-only DOM object property
    public get result(): object { // won't create attribute since type is object
        return new ElementMetadata(this._name, this._count);
    }

    private _increment() {
        let amount = this._amountTextInput.value; // we have captured through ref in JSX
        if (!amount) amount = '1';
        this._commandStore?.increment(parseInt(amount));
    }

    private _decrement() {
        let amount = this._amountTextInput.value; // https://stenciljs.com/docs/templating-jsx
        if (!amount) amount = '1';
        this._commandStore?.decrement(parseInt(amount));
    }

    private _addCount() {
        this._count++;
    }

    private _toggle() {
        this.collapsed = !this.collapsed;
    }

    private _syncName(event: any) {
        const value: string = event.target.value;
        // Just to show this._nameTextInput.value could also be used here
        console.info(`Typed name: ${this._nameTextInput.value}`);
        this._name = value ? value : 'World';
    }

    @Event({ // https://stenciljs.com/docs/events
        eventName: 'data-update',
        composed: true, // go through ShadowDom
        bubbles: true, // go up the DOM
    }) private _nameUpdated: EventEmitter<object>; // could be strongly typed

    private _notify(): void {
        // emit an object that will be `detail` of the CustomEvent
        this._nameUpdated.emit({ 
            elementId: this._hostElement.id,
            property: 'name',
            value: this._name,
        });
    }

    render() { // Top level element could be a <div> too, ref. https://stenciljs.com/docs/templating-jsx
        return (
            <Host> { /* ref={(el) => this._hostElement = el as HTMLElement} */ }
                <h1>Hello, {this._name}!</h1>
                Name: <input type="text"
                    ref={(el) => this._nameTextInput = el as HTMLInputElement}
                    onChange={() => this._notify()} // broadcast when name changes
                    onInput={(event: UIEvent) => this._syncName(event)} // sync to this._name
                    placeholder={this._name} />
                <button class="float-right" onClick={() => this._toggle()}>
                    {this.collapsed ? 'Expand ↓' : 'Collapse ↑'}
                </button>
                <div class={`box ${this.collapsed ? 'collapsed' : ''}`}> {/* whoa */}
                { /* short hand onClick={this._addCount} does NOT work */ }
                    <button onClick={() => this._addCount()}>
                        Click Count: {this._count}
                    </button>
                    <slot></slot>
                    Update amount:
                    <input type="number"
                        placeholder="0"
                        ref={(el) => this._amountTextInput = el as HTMLInputElement} />
                    {/* event handler short-hand ={this._increment} does NOT get ref element!! */}
                    <button onClick={() => this._increment()}>Increment</button>
                    <button onClick={() => this._decrement()}>Decrement</button>
                </div>
            </Host>
        );
    }
}